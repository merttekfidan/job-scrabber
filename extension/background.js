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
    return `You are an expert job application assistant. Extract and structure job posting information from the provided page content.

INPUT DATA:
- Page URL: ${extractedData.url}
- Page Title: ${extractedData.pageTitle}
- Job Board: ${extractedData.jobBoard}
- Raw Page Content: ${extractedData.pageContent}

TASK:
Analyze the page content and extract ALL relevant job information. Parse the raw text to identify:
- Job title
- Company name
- Location and work mode (remote/hybrid/onsite)
- Salary range (if mentioned)
- Key responsibilities
- Required and preferred skills
- Company description
- Any other relevant details

OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "workMode": "remote|hybrid|onsite|unknown",
  "salary": "string or null",
  "applicationDate": "${new Date().toISOString()}",
  "jobUrl": "${extractedData.url}",
  "companyUrl": "string or null (extract from content if available)",
  "status": "Applied",
  "keyResponsibilities": ["array of 3-5 main responsibilities extracted from job description"],
  "requiredSkills": ["array of key required skills"],
  "preferredSkills": ["array of preferred/nice-to-have skills"],
  "companyDescription": "brief 1-2 sentence company overview (extract from content)",
  "interviewPrepNotes": {
    "keyTalkingPoints": ["3-5 key points to emphasize based on job requirements"],
    "questionsToAsk": ["3-5 thoughtful questions to ask the interviewer"],
    "potentialRedFlags": ["any concerns or red flags noticed in the posting"]
  },
  "metadata": {
    "jobBoardSource": "${extractedData.jobBoard}",
    "extractedAt": "${new Date().toISOString()}"
  }
}

IMPORTANT INSTRUCTIONS:
- Parse the raw page content carefully to extract all information
- Infer work mode from location text (e.g., "Remote" = remote, specific city = onsite, "Hybrid" = hybrid)
- Extract salary if mentioned anywhere in the content
- Be specific and actionable in interview prep notes
- If information is not found in the content, use null or empty arrays
- Return ONLY the JSON object, no other text, no markdown formatting
- Make sure the JSON is valid and parseable`;
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
        const webAppUrl = result.sheetsWebAppUrl;

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
