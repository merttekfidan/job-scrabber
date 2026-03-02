import { DEFAULT_CONFIG } from './config.js';

const PROD_CANONICAL = 'https://www.huntiq.work';

const SESSION_COOKIE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
];

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
    VERSION: DEFAULT_CONFIG.VERSION,
  };
}

/**
 * Read the NextAuth session cookie directly via chrome.cookies API.
 * No CORS, no cross-origin fetch, no 3rd-party cookie restrictions.
 */
async function getSessionCookie(url) {
  for (const name of SESSION_COOKIE_NAMES) {
    const cookie = await chrome.cookies.get({ url, name });
    if (cookie) return cookie;
  }
  return null;
}

/**
 * Fetch session data from /api/auth/session using the cookie as header.
 * This runs in the service worker — host_permissions grant network access.
 */
async function fetchSession(baseUrl, cookieValue) {
  const res = await fetch(baseUrl + '/api/auth/session', {
    method: 'GET',
    headers: { Cookie: cookieValue },
  });
  if (!res.ok) return null;
  return res.json();
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'checkSession') {
    handleCheckSession()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (request.action === 'processJobData') {
    processJobServerSide(request.data)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleCheckSession() {
  const CONFIG = await getEnvironmentConfig();
  const baseUrl = CONFIG.BACKEND_URL;

  const cookie = await getSessionCookie(baseUrl);
  if (!cookie) {
    return { status: 'no_session' };
  }

  const cookieHeader = `${cookie.name}=${cookie.value}`;
  const session = await fetchSession(baseUrl, cookieHeader);

  if (session?.user?.email) {
    return { status: 'logged_in', email: session.user.email, name: session.user.name };
  }

  return { status: 'no_session' };
}

async function processJobServerSide(extractedData) {
  try {
    const CONFIG = await getEnvironmentConfig();
    const baseUrl = CONFIG.BACKEND_URL;

    const cookie = await getSessionCookie(baseUrl);
    if (!cookie) {
      throw new Error('Not logged in. Please log in to the dashboard first.');
    }
    const cookieHeader = `${cookie.name}=${cookie.value}`;

    const processUrl = baseUrl + '/api/extension/process';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const headers = { 'Content-Type': 'application/json', Cookie: cookieHeader };
    if (CONFIG.IS_DEV) headers['x-dev-extension'] = 'true';

    let processResponse;
    try {
      processResponse = await fetch(processUrl, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          url: extractedData.url,
          pageContent: extractedData.pageContent,
          jobBoard: extractedData.jobBoard || 'Unknown',
          pageTitle: extractedData.pageTitle || '',
        }),
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
    const syncResult = await syncToRemoteStorage(structuredData);
    if (syncResult && syncResult.error) {
      return { success: false, error: syncResult.error };
    }

    await saveApplicationLocally(structuredData);
    return { success: true, data: structuredData };
  } catch (error) {
    console.error('Processing error:', error);
    return { success: false, error: error.message };
  }
}

async function saveApplicationLocally(applicationData) {
  try {
    const result = await chrome.storage.local.get(['applications']);
    const applications = result.applications || [];
    applications.push(applicationData);

    await chrome.storage.local.set({
      applications,
      lastCapture: {
        jobTitle: applicationData.jobTitle,
        company: applicationData.company,
        timestamp: new Date().toISOString(),
      },
    });
    return true;
  } catch (error) {
    console.error('Local save error:', error);
  }
}

async function syncToRemoteStorage(applicationData) {
  try {
    const CONFIG = await getEnvironmentConfig();
    const cookie = await getSessionCookie(CONFIG.BACKEND_URL);
    if (!cookie) return { error: 'Not logged in' };

    const saveUrl = CONFIG.BACKEND_URL + '/api/save';
    const headers = { 'Content-Type': 'application/json', Cookie: `${cookie.name}=${cookie.value}` };
    if (CONFIG.IS_DEV) headers['x-dev-extension'] = 'true';

    const response = await fetch(saveUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(applicationData),
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

chrome.runtime.onInstalled.addListener(async () => {
  console.log('HuntIQ v' + DEFAULT_CONFIG.VERSION + ' installed');
  const result = await chrome.storage.local.get(['applications', 'environment']);
  if (!result.applications) chrome.storage.local.set({ applications: [] });
  if (!result.environment) chrome.storage.local.set({ environment: 'production' });
});
