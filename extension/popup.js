import { DEFAULT_CONFIG } from './config.js';

let CONFIG = DEFAULT_CONFIG;

const PROD_CANONICAL = 'https://www.huntiq.work';

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

const applyBtn = document.getElementById('applyBtn');
const exportBtn = document.getElementById('exportBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const statusDiv = document.getElementById('status');
const lastCaptureDiv = document.getElementById('lastCapture');
const totalAppsSpan = document.getElementById('totalApps');
const logoutBtn = document.getElementById('logoutBtn');

const STATUS_ICONS = {
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

function updateUIToLoggedIn(email) {
  const userStatusDiv = document.getElementById('userStatus');
  const statusDot = userStatusDiv.querySelector('.status-dot');
  const userEmailSpan = userStatusDiv.querySelector('.user-email');
  statusDot.className = 'status-dot connected';
  userEmailSpan.textContent = email;
  if (logoutBtn) {
    logoutBtn.classList.remove('hidden');
  }
}

function updateUIToLoggedOut() {
  const userStatusDiv = document.getElementById('userStatus');
  const statusDot = userStatusDiv.querySelector('.status-dot');
  const userEmailSpan = userStatusDiv.querySelector('.user-email');
  statusDot.className = 'status-dot disconnected';
  userEmailSpan.innerHTML = '<a href="' + CONFIG.BACKEND_URL + '/login" target="_blank">Login Required</a>';
  if (logoutBtn) {
    logoutBtn.classList.add('hidden');
  }
}

function updateUIToOffline() {
  const userStatusDiv = document.getElementById('userStatus');
  const statusDot = userStatusDiv.querySelector('.status-dot');
  const userEmailSpan = userStatusDiv.querySelector('.user-email');
  statusDot.className = 'status-dot disconnected';
  userEmailSpan.textContent = 'Offline';
  if (logoutBtn) {
    logoutBtn.classList.add('hidden');
  }
}

/** Try to get session via a dashboard tab (same-origin, no CORS). */
function checkConnectionViaTab() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSessionViaTab' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

/** Direct fetch from extension (can fail due to CORS). */
async function directFetchSession() {
  const baseUrl = CONFIG.BACKEND_URL;
  const headers = {};
  if (CONFIG.IS_DEV) headers['x-dev-extension'] = 'true';

  const healthUrl = baseUrl + '/api/health';
  const healthRes = await fetch(healthUrl, { method: 'GET', headers });
  if (!healthRes.ok) return null;

  const sessionUrl = baseUrl + '/api/auth/session';
  const response = await fetch(sessionUrl, { credentials: 'include', headers });
  if (!response.ok) return null;
  return response.json();
}

async function checkConnection() {
  const baseUrl = CONFIG.BACKEND_URL;
  console.log('[HuntIQ] checkConnection start', { baseUrl });

  const tabSession = await checkConnectionViaTab();
  if (tabSession && tabSession.user && tabSession.user.email) {
    updateUIToLoggedIn(tabSession.user.email);
    await chrome.storage.local.set({ userEmail: tabSession.user.email });
    return;
  }
  if (tabSession && !tabSession.error && !tabSession.user?.email) {
    await chrome.storage.local.remove(['userEmail']);
    updateUIToLoggedOut();
    return;
  }
  if (tabSession && tabSession.error && tabSession.error !== 'no_tab') {
    await chrome.storage.local.remove(['userEmail']);
    updateUIToLoggedOut();
    return;
  }

  try {
    const session = await directFetchSession();
    if (session?.user?.email) {
      updateUIToLoggedIn(session.user.email);
      await chrome.storage.local.set({ userEmail: session.user.email });
      return;
    }
    await chrome.storage.local.remove(['userEmail']);
    updateUIToLoggedOut();
  } catch (error) {
    console.error('[HuntIQ] Connection check failed:', error);
    await chrome.storage.local.remove(['userEmail']);
    if (tabSession && tabSession.error === 'no_tab') {
      userStatusSetOfflineWithHint();
    } else {
      updateUIToOffline();
    }
  }
}

function userStatusSetOfflineWithHint() {
  const userStatusDiv = document.getElementById('userStatus');
  const statusDot = userStatusDiv.querySelector('.status-dot');
  const userEmailSpan = userStatusDiv.querySelector('.user-email');
  statusDot.className = 'status-dot disconnected';
  userEmailSpan.innerHTML = 'Open <a href="' + CONFIG.BACKEND_URL + '" target="_blank">Dashboard</a> and log in';
  if (logoutBtn) logoutBtn.classList.add('hidden');
}

async function handleLogout() {
  try {
    const baseUrl = CONFIG.BACKEND_URL;
    const csrfRes = await fetch(baseUrl + '/api/auth/csrf', { credentials: 'include' });
    const { csrfToken } = await csrfRes.json();

    await fetch(baseUrl + '/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `csrfToken=${encodeURIComponent(csrfToken)}`,
    });
  } catch (e) {
    console.error('Logout API failed:', e);
  }

  await chrome.storage.local.remove(['userEmail', 'applications', 'lastCapture']);
  updateUIToLoggedOut();
  await updateStats();
  if (lastCaptureDiv) lastCaptureDiv.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[HuntIQ] popup loaded');
  CONFIG = await getEnvironmentConfig();
  console.log('[HuntIQ] CONFIG', { BACKEND_URL: CONFIG.BACKEND_URL, IS_DEV: CONFIG.IS_DEV });

  await updateStats();
  await loadLastCapture();
  await checkConnection();
  await checkAlreadyApplied();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      handleLogout();
    });
  }

  const result = await chrome.storage.local.get(['autoExport', 'environment']);
  if (result.autoExport) {
    document.getElementById('autoExport').checked = result.autoExport;
  }

  const envSelect = document.getElementById('environmentToggle');
  if (envSelect) {
    envSelect.value = result.environment || 'production';
    envSelect.addEventListener('change', async (e) => {
      await chrome.storage.local.set({ environment: e.target.value });
      CONFIG = await getEnvironmentConfig();
      await checkConnection();
    });
  }
});

async function checkAlreadyApplied() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;

    let currentUrl = tabs[0].url;
    if (!currentUrl || currentUrl.startsWith('chrome://')) return;

    const cleanCurrentUrl = currentUrl.split('?')[0].replace(/\/$/, '');
    const result = await chrome.storage.local.get(['applications']);
    const applications = result.applications || [];

    const hasApplied = applications.some((app) => {
      if (!app.url) return false;
      const cleanAppUrl = app.url.split('?')[0].replace(/\/$/, '');
      return cleanCurrentUrl === cleanAppUrl;
    });

    if (hasApplied) {
      document.getElementById('alreadyAppliedBadge').classList.remove('hidden');
      applyBtn.style.backgroundColor = '#4b5563';
      applyBtn.style.borderColor = '#374151';
      document.querySelector('#applyBtn .btn-text').textContent = 'Update Application';
    }
  } catch (error) {
    console.error('Failed to check already applied status:', error);
  }
}

async function updateStats() {
  const result = await chrome.storage.local.get(['applications']);
  const apps = result.applications || [];
  totalAppsSpan.textContent = `${apps.length} tracked`;
}

async function loadLastCapture() {
  const result = await chrome.storage.local.get(['lastCapture']);
  if (result.lastCapture) {
    const capture = result.lastCapture;
    lastCaptureDiv.querySelector('.capture-title').textContent = capture.jobTitle;
    lastCaptureDiv.querySelector('.capture-company').textContent = capture.company;
    lastCaptureDiv.querySelector('.capture-time').textContent = new Date(capture.timestamp).toLocaleDateString();
    lastCaptureDiv.classList.remove('hidden');
  }
}

function showStatus(message, type = 'info') {
  statusDiv.className = `status ${type}`;
  statusDiv.querySelector('.status-text').textContent = message;
  statusDiv.querySelector('.status-icon').innerHTML = STATUS_ICONS[type] || STATUS_ICONS.info;
  statusDiv.classList.remove('hidden');

  if (type === 'success' || type === 'error') {
    setTimeout(() => statusDiv.classList.add('hidden'), 4000);
  }
}

applyBtn.addEventListener('click', () => applyJob());

async function applyJob() {
  try {
    applyBtn.classList.add('processing');
    applyBtn.disabled = true;
    showStatus('Extracting job data…', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' }, async (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Failed to extract data from page', 'error');
        resetApplyBtn();
        return;
      }

      if (response && response.success) {
        showStatus('Processing with AI…', 'info');

        chrome.runtime.sendMessage(
          {
            action: 'processJobData',
            data: response.data,
          },
          async (processResponse) => {
            if (processResponse && processResponse.success) {
              showStatus('Saved!', 'success');
              await updateStats();
              await loadLastCapture();

              const settings = await chrome.storage.local.get(['autoExport']);
              if (settings.autoExport) exportToCSV();
            } else {
              showStatus(processResponse?.error || 'Failed to process', 'error');
              if (processResponse?.error && processResponse.error.includes('logged in')) {
                await chrome.storage.local.remove(['userEmail']);
                updateUIToLoggedOut();
              }
            }

            resetApplyBtn();
          }
        );
      } else {
        showStatus(response?.error || 'Failed to extract job data', 'error');
        resetApplyBtn();
      }
    });
  } catch (error) {
    console.error('Error:', error);
    showStatus('An error occurred', 'error');
    resetApplyBtn();
  }
}

function resetApplyBtn() {
  applyBtn.classList.remove('processing');
  applyBtn.disabled = false;
}

exportBtn.addEventListener('click', exportToCSV);

async function exportToCSV() {
  try {
    const result = await chrome.storage.local.get(['applications']);
    const apps = result.applications || [];

    if (apps.length === 0) {
      showStatus('No applications to export', 'error');
      return;
    }

    const headers = ['Timestamp', 'Job Title', 'Company', 'Location', 'Work Mode', 'Salary', 'Status', 'Job URL'];
    const rows = apps.map((app) => [
      app.applicationDate,
      app.jobTitle,
      app.company,
      app.location || '',
      app.workMode || '',
      app.salary || '',
      app.status || 'Applied',
      app.jobUrl,
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showStatus('CSV exported!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Export failed', 'error');
  }
}

settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

document.getElementById('autoExport').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ autoExport: e.target.checked });
  showStatus(e.target.checked ? 'Auto-export enabled' : 'Auto-export disabled', 'success');
});

openDashboardBtn.addEventListener('click', () => {
  window.open(CONFIG.BACKEND_URL, '_blank');
});

const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
if (privacyPolicyBtn) {
  privacyPolicyBtn.addEventListener('click', () => {
    window.open(CONFIG.BACKEND_URL + '/privacy', '_blank');
  });
}
