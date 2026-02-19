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

        // Construct prompt for Groq
        const prompt = buildPrompt(extractedData);

        // Call Groq API
        const groqResponse = await callGroqAPI(apiKey, prompt);

        // Parse and validate response
        const expertOutput = parseGroqResponse(groqResponse);

        // Map Expert Output to Legacy/Dashboard Schema
        const structuredData = {
            ...expertOutput,
            // Mapping for backward compatibility and dashboard schema
            jobUrl: extractedData.url,
            applicationDate: new Date().toISOString(),
            roleSummary: expertOutput.interviewPrepNotes?.theProblemTheyAreSolving || null,
            interviewPrepNotes: {
                keyTalkingPoints: (expertOutput.interviewPrepNotes?.keyTalkingPoints || []).map(tp => ({
                    point: tp.topic || tp.point,
                    explanation: tp.narrative || tp.explanation
                })),
                questionsToAsk: expertOutput.interviewPrepNotes?.highImpactQuestions || expertOutput.interviewPrepNotes?.questionsToAsk || [],
                potentialRedFlags: expertOutput.negativeSignals || expertOutput.interviewPrepNotes?.potentialRedFlags || [],
                techStackToStudy: expertOutput.techStackToStudy || []
            },
            originalContent: extractedData.pageContent
        };

        // Save to storage
        await saveApplication(structuredData);

        return { success: true, data: structuredData };

    } catch (error) {
        console.error('Processing error:', error);
        return { success: false, error: error.message };
    }
}

// Build expert prompt for Groq API
function buildPrompt(extractedData) {
    return `# ROLE
You are a Senior MarTech Career Architect and Executive Coach. Your mission is to analyze job postings with surgical precision and provide high-stakes strategic advice to a top-tier candidate.

# CONTEXT
- SOURCE_URL: ${extractedData.url}
- JOB_BOARD: ${extractedData.jobBoard}
- INPUT_PAYLOAD: ${extractedData.pageContent}

# STEPS (Chain of Thought)
1. DATA SCRUBBING: Extract raw job details. Clean any noise if the scraping was messy.
2. SENTIMENT & SIGNAL ANALYSIS: Identify "Negative Signals" (hidden deal-breakers) and "Power Hooks" (the real problem the company is trying to solve).
3. TECH STACK MAPPING: Catalog every technical tool mentioned, specifically prioritizing the MarTech ecosystem (GA4, GTM, HubSpot, SQL, etc.).
4. STRATEGIC POSITIONING: Craft coaching notes that connect the candidate's likely skills to the company's pain points. Avoid generic advice; be specific and inspirational.

# OUTPUT FORMAT (STRICT JSON)
{
  "jobTitle": "Official title or best summary",
  "company": "Company Name",
  "location": "City, State or 'Global' if fully remote",
  "workMode": "Remote|Hybrid|Onsite",
  "salary": "Range or 'Confidential'",
  "requiredSkills": ["hard skills only"],
  "techStackToStudy": ["tools + brief 'why it matters'"],
  "negativeSignals": [
    "Identify red flags like: 'unrealistic experience expectations', 'manual repetitive tasks', 'lack of growth mentions'"
  ],
  "interviewPrepNotes": {
    "theProblemTheyAreSolving": "1 sentence on the business problem behind this hire.",
    "keyTalkingPoints": [
      {
        "topic": "Strategic Topic",
        "narrative": "A 2-3 sentence highly-specific talking point the candidate should lead with."
      }
    ],
    "highImpactQuestions": [
      "Suggest questions that show curiosity about growth, culture, or long-term vision."
    ]
  },
  "formattedContent": "A professional, beautiful Markdown version of the full job spec for the user's permanent records."
}

# CONSTRAINTS
- NO JARGON: Use plain, powerful English for coaching notes.
- ACCURACY: If a field is unknown, use null. DO NOT hallucinate salary.
- LANGUAGE: Output must be in English.
- STRICT JSON: Return ONLY the JSON object.`;
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

        // Validate required fields (only core identification for expert mode)
        const required = ['jobTitle', 'company'];
        for (const field of required) {
            if (!parsed[field]) {
                throw new Error(`Missing required field from AI: ${field}`);
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
            credentials: 'include', //  <-- IMPORTANT: Send cookies for authentication
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
