// Background service worker for Chrome extension

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processJobData') {
        processJobServerSide(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

// Process job data through the server-side API
async function processJobServerSide(extractedData) {
    try {
        const result = await chrome.storage.local.get(['backendUrl']);
        const backendUrl = result.backendUrl;

        if (!backendUrl) {
            throw new Error('Backend URL not configured. Please set it in extension settings.');
        }

        const baseUrl = backendUrl.replace(/\/api\/save\/?$/, '');

        // Step 1: Send raw content to server for AI processing
        const processUrl = baseUrl + '/api/extension/process';

        const processResponse = await fetch(processUrl, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: extractedData.url,
                pageContent: extractedData.pageContent,
                jobBoard: extractedData.jobBoard || 'Unknown',
                pageTitle: extractedData.pageTitle || '',
            })
        });

        if (!processResponse.ok) {
            const errorData = await processResponse.json().catch(() => ({}));
            if (processResponse.status === 401) {
                throw new Error('Not logged in. Please log in to the dashboard first.');
            }
            if (processResponse.status === 429) {
                throw new Error('Rate limited. Please wait a moment and try again.');
            }
            throw new Error(errorData.error || `Server error: ${processResponse.status}`);
        }

        const processResult = await processResponse.json();
        if (!processResult.success) {
            throw new Error(processResult.error || 'AI processing failed');
        }

        const structuredData = processResult.data;

        // Step 2: Save to remote storage
        const syncResult = await syncToRemoteStorage(structuredData);

        if (syncResult && syncResult.error) {
            return { success: false, error: syncResult.error };
        }

        // Step 3: Save locally for offline access
        await saveApplicationLocally(structuredData);

        return { success: true, data: structuredData };

    } catch (error) {
        console.error('Processing error:', error);
        return { success: false, error: error.message };
    }
}

// Save application to local Chrome storage
async function saveApplicationLocally(applicationData) {
    try {
        const result = await chrome.storage.local.get(['applications']);
        const applications = result.applications || [];

        applications.push(applicationData);

        await chrome.storage.local.set({
            applications: applications,
            lastCapture: {
                jobTitle: applicationData.jobTitle,
                company: applicationData.company,
                timestamp: new Date().toISOString()
            }
        });

        return true;
    } catch (error) {
        console.error('Local save error:', error);
    }
}

// Sync application to remote storage
async function syncToRemoteStorage(applicationData) {
    try {
        const result = await chrome.storage.local.get(['backendUrl']);
        const backendUrl = result.backendUrl;

        if (!backendUrl) {
            console.log('Backend URL not configured, skipping remote sync');
            return null;
        }

        const saveUrl = backendUrl.replace(/\/api\/save\/?$/, '') + '/api/save';

        const response = await fetch(saveUrl, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applicationData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Unknown error from remote storage');
        }

        return data;

    } catch (error) {
        console.error('Remote storage sync error:', error);
        return { error: error.message };
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Job Application Tracker installed');

    chrome.storage.local.get(['applications'], (result) => {
        if (!result.applications) {
            chrome.storage.local.set({ applications: [] });
        }
    });
});
