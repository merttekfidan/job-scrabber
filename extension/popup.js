// DOM Elements
const applyBtn = document.getElementById('applyBtn');
const exportBtn = document.getElementById('exportBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const sheetsUrlInput = document.getElementById('sheetsUrl');
const saveSettingsBtn = document.getElementById('saveSettings');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const statusDiv = document.getElementById('status');
const lastCaptureDiv = document.getElementById('lastCapture');
const totalAppsSpan = document.getElementById('totalApps');

// SVG icon templates for status
const STATUS_ICONS = {
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateStats();
  await loadLastCapture();
  await checkConnection();
});

// Check connection to backend
async function checkConnection() {
  const userStatusDiv = document.getElementById('userStatus');
  const statusDot = userStatusDiv.querySelector('.status-dot');
  const userEmailSpan = userStatusDiv.querySelector('.user-email');

  try {
    const backendUrl = sheetsUrlInput.value.trim();
    if (!backendUrl) {
      statusDot.className = 'status-dot disconnected';
      userEmailSpan.textContent = 'No backend URL';
      return;
    }

    const baseUrl = backendUrl.replace(/\/api\/save\/?$/, '');
    const statsUrl = baseUrl + '/api/stats';

    const response = await fetch(statsUrl, { credentials: 'include' });

    if (response.status === 401) {
      statusDot.className = 'status-dot disconnected';
      userEmailSpan.innerHTML = '<a href="' + baseUrl + '/login" target="_blank">Login Required</a>';
      return;
    }

    if (response.ok) {
      const data = await response.json();
      if (data.user && data.user.email) {
        statusDot.className = 'status-dot connected';
        userEmailSpan.textContent = data.user.email;
        chrome.storage.local.set({ userEmail: data.user.email });
      }
    } else {
      throw new Error('Failed to connect');
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    statusDot.className = 'status-dot disconnected';
    userEmailSpan.textContent = 'Offline';
  }
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get(['backendUrl', 'autoExport']);
  if (result.backendUrl) {
    sheetsUrlInput.value = result.backendUrl;
    openDashboardBtn.classList.remove('hidden');
  }
  if (result.autoExport) {
    document.getElementById('autoExport').checked = result.autoExport;
  }
  updateToggleState();
}

// Update statistics
async function updateStats() {
  const result = await chrome.storage.local.get(['applications']);
  const apps = result.applications || [];
  totalAppsSpan.textContent = `${apps.length} tracked`;
}

// Load last capture info
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

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.className = `status ${type}`;
  statusDiv.querySelector('.status-text').textContent = message;
  statusDiv.querySelector('.status-icon').innerHTML = STATUS_ICONS[type] || STATUS_ICONS.info;
  statusDiv.classList.remove('hidden');

  if (type === 'success' || type === 'error') {
    setTimeout(() => { statusDiv.classList.add('hidden'); }, 4000);
  }
}

// ── Apply Button ──
applyBtn.addEventListener('click', () => applyJob());

async function applyJob() {
  try {
    const result = await chrome.storage.local.get(['backendUrl']);
    if (!result.backendUrl) {
      showStatus('Set your backend URL in Settings', 'error');
      settingsPanel.classList.remove('hidden');
      return;
    }

    applyBtn.classList.add('processing');
    applyBtn.disabled = true;
    showStatus('Extracting job data…', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' }, async (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Failed to extract data from page', 'error');
        resetApplyBtn();
        return;
      }

      if (response && response.success) {
        showStatus('Processing with AI…', 'info');

        chrome.runtime.sendMessage({
          action: 'processJobData',
          data: response.data
        }, async (processResponse) => {
          if (processResponse && processResponse.success) {
            showStatus('Saved!', 'success');
            await updateStats();
            await loadLastCapture();

            const settings = await chrome.storage.local.get(['autoExport']);
            if (settings.autoExport) exportToCSV();
          } else {
            showStatus(processResponse?.error || 'Failed to process', 'error');
          }

          resetApplyBtn();
        });
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

// ── Export CSV ──
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
    const rows = apps.map(app => [
      app.applicationDate, app.jobTitle, app.company, app.location || '',
      app.workMode || '', app.salary || '', app.status || 'Applied', app.jobUrl
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
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

// ── Settings ──
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

saveSettingsBtn.addEventListener('click', async () => {
  const backendUrl = sheetsUrlInput.value.trim();
  const autoExport = document.getElementById('autoExport').checked;

  if (!backendUrl) {
    showStatus('Enter a backend URL', 'error');
    return;
  }

  await chrome.storage.local.set({ backendUrl, autoExport });

  if (backendUrl) {
    openDashboardBtn.classList.remove('hidden');
  } else {
    openDashboardBtn.classList.add('hidden');
  }

  showStatus('Settings saved!', 'success');
  settingsPanel.classList.add('hidden');
  await checkConnection();
});

// Environment Toggle
const envLiveBtn = document.getElementById('envLive');
const envLocalBtn = document.getElementById('envLocal');
const LIVE_URL = 'https://aware-endurance-production-13b8.up.railway.app';
const LOCAL_URL = 'http://localhost:3000';

function setEnvironment(env) {
  if (env === 'live') {
    sheetsUrlInput.value = LIVE_URL;
    envLiveBtn.classList.add('active');
    envLocalBtn.classList.remove('active');
  } else {
    sheetsUrlInput.value = LOCAL_URL;
    envLocalBtn.classList.add('active');
    envLiveBtn.classList.remove('active');
  }
}

envLiveBtn.addEventListener('click', () => setEnvironment('live'));
envLocalBtn.addEventListener('click', () => setEnvironment('local'));
sheetsUrlInput.addEventListener('input', updateToggleState);

function updateToggleState() {
  const currentUrl = sheetsUrlInput.value.trim();
  envLiveBtn.classList.toggle('active', currentUrl === LIVE_URL);
  envLocalBtn.classList.toggle('active', currentUrl === LOCAL_URL);
}

// Open Dashboard
openDashboardBtn.addEventListener('click', async () => {
  const result = await chrome.storage.local.get(['backendUrl']);
  if (result.backendUrl) {
    const dashboardUrl = result.backendUrl.replace(/\/api\/save\/?$/, '');
    window.open(dashboardUrl, '_blank');
  }
});
