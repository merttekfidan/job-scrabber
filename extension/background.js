// Background service worker for Chrome extension

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processJobData') {
        processJobWithGemini(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

// Process job data with Gemini API
async function processJobWithGemini(extractedData) {
    try {
        // Get API key from storage
        const result = await chrome.storage.local.get(['groqApiKey']);
        const apiKey = result.groqApiKey;

        if (!apiKey) {
            throw new Error('Groq API key not configured');
        }

        // Construct prompt for Gemini
        const prompt = buildPrompt(extractedData);

        // Call Groq API
        const groqResponse = await callGroqAPI(apiKey, prompt);

        // Parse and validate response
        const structuredData = parseGroqResponse(groqResponse);

        // Add original content manually to avoid token limits in LLM response
        structuredData.originalContent = extractedData.pageContent;

        // Save to storage
        await saveApplication(structuredData);

        return { success: true, data: structuredData };

    } catch (error) {
        console.error('Processing error:', error);
        return { success: false, error: error.message };
    }
}

// Build prompt for Groq API
function buildPrompt(extractedData) {
    return `You are an expert career coach specializing in Tech Marketing and Digital Marketing. Extract and structure job posting information from the provided page content.

INPUT DATA:
- Page URL: ${extractedData.url}
- Page Title: ${extractedData.pageTitle}
- Job Board: ${extractedData.jobBoard}
- Raw Page Content: ${extractedData.pageContent}

TASK:
Analyze the page content and extract ALL relevant job information. specifically LOOK FOR MARTECH TOOLS (e.g., GA4, HubSpot, Salesforce, SQL, Python, Tableau, SEMrush).

OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact structure:
{
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "workMode": "Remote|Hybrid|Onsite|Unknown",
  "salary": "string or null",
  "applicationDate": "${new Date().toISOString()}",
  "jobUrl": "${extractedData.url}",
  "companyUrl": "string or null",
  "status": "Applied",
  "keyResponsibilities": ["array of 3-5 main responsibilities"],
  "requiredSkills": ["array of key skills, prioritizing hard technical marketing skills"],
  "preferredSkills": ["array of preferred skills"],
  "companyDescription": "brief 1-2 sentence company overview",
  "formattedContent": "The entire job posting reformatted into clean, readable Markdown. Use headers, bullet points, and bold text for emphasis. Remove clutter but keep all details.",
  "negativeSignals": ["List specific exclusionary criteria found in the post, e.g. 'No agencies', 'Must have EU citizenship', 'Not suitable for juniors', 'In-office only'"],
  "interviewPrepNotes": {
    "keyTalkingPoints": [
      {
        "point": "Strategic Value Point",
        "explanation": "Simple, supportive coaching advice (2-3 sentences). Explain WHY this specific skill relates to this company's offer and HOW it solves their unique problems. Use 'plain English'—no corporate jargon."
      }
    ],
    "questionsToAsk": ["3-5 high-impact, inspirational questions. Instead of 'standard' questions, suggest ones that show curiosity about their growth, culture, or long-term vision. Think: 'What would a future leader ask?'"],
    "potentialRedFlags": ["any concerns a coach would want you to know"],
    "techStackToStudy": ["Specific tools to master, with a quick note on why they matter for THIS role"]
  },
  "metadata": {
    "jobBoardSource": "${extractedData.jobBoard}",
    "extractedAt": "${new Date().toISOString()}"
  }
}

IMPORTANT:
- Focus on extracting the TECH STACK.
- Return ONLY valid JSON.
- Ensure all newlines and special characters in string values are properly escaped (use \\n for newlines).`;
}

// Call Groq API
async function callGroqAPI(apiKey, prompt) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const requestBody = {
        model: 'llama-3.3-70b-versatile', // Fast and powerful model
        messages: [{
            role: 'user',
            content: prompt
        }],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.95
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from Groq API');
    }

    return data.choices[0].message.content;
}

// Parse Groq response
function parseGroqResponse(responseText) {
    try {
        // Remove markdown code blocks if present
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```\n?/g, '');
        }

        // Handle unescaped control characters that often break JSON.parse
        // This regex finds newlines inside what looks like an unclosed string
        // Note: This is an approximation for non-compliant model outputs
        cleanText = cleanText.replace(/\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, "\\n");

        const parsed = JSON.parse(cleanText);

        // Validate required fields
        const required = ['jobTitle', 'company', 'jobUrl', 'applicationDate'];
        for (const field of required) {
            if (!parsed[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        return parsed;

    } catch (error) {
        console.error('Parse error:', error);
        console.error('Response text:', responseText);
        throw new Error(`Failed to parse Groq response: ${error.message}`);
    }
}

// Save application to storage
async function saveApplication(applicationData) {
    try {
        // Get existing applications
        const result = await chrome.storage.local.get(['applications']);
        const applications = result.applications || [];

        // Check for duplicates based on URL
        const existingIndex = applications.findIndex(app => app.jobUrl === applicationData.jobUrl);

        if (existingIndex !== -1) {
            // Update existing application
            applications[existingIndex] = {
                ...applications[existingIndex],
                ...applicationData,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new application
            applications.push(applicationData);
        }

        // Save back to storage
        await chrome.storage.local.set({
            applications: applications,
            lastCapture: {
                jobTitle: applicationData.jobTitle,
                company: applicationData.company,
                timestamp: new Date().toISOString()
            }
        });

        // Sync to remote storage (Google Sheets or PHP MySQL)
        await syncToRemoteStorage(applicationData);

        return true;

    } catch (error) {
        console.error('Save error:', error);
        throw new Error(`Failed to save application: ${error.message}`);
    }
}

// Sync application to remote storage (Google Sheets or PHP MySQL)
async function syncToRemoteStorage(applicationData) {
    try {
        // Get Web App URL from storage (can be Google Apps Script or PHP endpoint)
        const result = await chrome.storage.local.get(['sheetsWebAppUrl']);
        // Use configured URL or fallback to production default
        const webAppUrl = result.sheetsWebAppUrl || 'https://aware-endurance-production-13b8.up.railway.app/api/save';

        if (!webAppUrl) {
            console.log('Remote storage URL not configured, skipping sync');
            return;
        }

        // Send data to remote endpoint
        const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(applicationData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Unknown error from remote storage');
        }

        console.log('Successfully synced to remote storage:', data.message);

    } catch (error) {
        console.error('Remote storage sync error:', error);
        // Don't throw - we don't want to fail the save if sync fails
        // The data is still saved locally in Chrome storage
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Job Application Tracker installed');

    // Initialize storage if needed
    chrome.storage.local.get(['applications'], (result) => {
        if (!result.applications) {
            chrome.storage.local.set({ applications: [] });
        }
    });
});
