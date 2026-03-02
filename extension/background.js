// Background service worker for Chrome extension

// Import config
import { DEFAULT_CONFIG } from './config.js';

const PROD_CANONICAL = 'https://www.huntiq.work';

// Get current environment config (always use www in production)
async function getEnvironmentConfig() {
    const result = await chrome.storage.local.get(['environment']);
    const isDev = result.environment === 'development';
    let backendUrl = isDev ? DEFAULT_CONFIG.DEV_URL : DEFAULT_CONFIG.PROD_URL;
    if (!isDev && backendUrl.startsWith('https://huntiq.work') && backendUrl !== PROD_CANONICAL) {
        backendUrl = PROD_CANONICAL;
    }
    return {
        BACKEND_URL: backendUrl,
        IS_DEV: isDev,
        VERSION: DEFAULT_CONFIG.VERSION
    };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processJobData') {
        processJobServerSide(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
    if (request.action === 'getSessionViaTab') {
        getSessionViaDashboardTab().then(sendResponse).catch((err) => sendResponse({ error: err.message || 'no_tab' }));
        return true;
    }
});

/** Get session from a HuntIQ dashboard tab (same-origin fetch, no CORS). */
async function getSessionViaDashboardTab() {
    const CONFIG = await getEnvironmentConfig();
    const base = CONFIG.BACKEND_URL.replace(/\/$/, '');
    const tabs = await chrome.tabs.query({ url: base + '/*' });
    if (!tabs.length) {
        throw new Error('no_tab');
    }
    const tab = tabs[0];
    if (!tab.id) {
        throw new Error('no_tab');
    }
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'getSession' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error('no_tab'));
                return;
            }
            if (response && response.error) {
                reject(new Error(response.error));
                return;
            }
            resolve(response || {});
        });
    });
}

// Process job data through the server-side API
async function processJobServerSide(extractedData) {
    try {
        const CONFIG = await getEnvironmentConfig();
        const baseUrl = CONFIG.BACKEND_URL;

        // Step 1: Send raw content to server for AI processing
        const processUrl = baseUrl + '/api/extension/process';

        // 60-second timeout for AI processing (large job pages can take a while)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const headers = { 'Content-Type': 'application/json' };
        if (CONFIG.IS_DEV) headers['x-dev-extension'] = 'true';

        let processResponse;
        try {
            processResponse = await fetch(processUrl, {
                method: 'POST',
                credentials: 'include',
                headers,
                signal: controller.signal,
                body: JSON.stringify({
                    url: extractedData.url,
                    pageContent: extractedData.pageContent,
                    jobBoard: extractedData.jobBoard || 'Unknown',
                    pageTitle: extractedData.pageTitle || '',
                })
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('AI processing timed out after 60 seconds. Try a simpler job page or try again.');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }

        if (!processResponse.ok) {
            const errorData = await processResponse.json().catch(() => ({}));
            if (processResponse.status === 401) {
                await chrome.storage.local.remove(['userEmail']);
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
        const CONFIG = await getEnvironmentConfig();
        const saveUrl = CONFIG.BACKEND_URL + '/api/save';

        const headers = { 'Content-Type': 'application/json' };
        if (CONFIG.IS_DEV) headers['x-dev-extension'] = 'true';

        const response = await fetch(saveUrl, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify(applicationData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                await chrome.storage.local.remove(['userEmail']);
            }
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
chrome.runtime.onInstalled.addListener(async () => {
    console.log('HuntIQ v' + DEFAULT_CONFIG.VERSION + ' installed');

    // Default to production environment
    const result = await chrome.storage.local.get(['applications', 'environment']);

    if (!result.applications) {
        chrome.storage.local.set({ applications: [] });
    }

    if (!result.environment) {
        chrome.storage.local.set({ environment: 'production' });
    }
});
