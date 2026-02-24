import { DEFAULT_CONFIG } from './config.js';

let CONFIG = DEFAULT_CONFIG;

// Get current environment config
async function getEnvironmentConfig() {
  const result = await chrome.storage.local.get(['environment']);
  const isDev = result.environment === 'development';
  return {
    BACKEND_URL: isDev ? DEFAULT_CONFIG.DEV_URL : DEFAULT_CONFIG.PROD_URL,
    IS_DEV: isDev,
    VERSION: DEFAULT_CONFIG.VERSION
  };
}

// DOM Elements
const applyBtn = document.getElementById('applyBtn');
const exportBtn = document.getElementById('exportBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
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
  CONFIG = await getEnvironmentConfig();

  await updateStats();
  await loadLastCapture();
  await checkConnection();

  await checkAlreadyApplied();

  // Load auto-export preference
  const result = await chrome.storage.local.get(['autoExport', 'environment']);
  if (result.autoExport) {
    document.getElementById('autoExport').checked = result.autoExport;
  }

  // Set environment toggle state
  const envSelect = document.getElementById('environmentToggle');
  if (envSelect) {
    envSelect.value = result.environment || 'production';
    envSelect.addEventListener('change', async (e) => {
      await chrome.storage.local.set({ environment: e.target.value });

      // Update config and re-check connection
      CONFIG = await getEnvironmentConfig();
      await checkConnection();
    });
  }
});

// Check if the current tab URL has already been applied to
async function checkAlreadyApplied() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;

    // Normalize current URL (strip query params and trailing slashes for clean matching)
    let currentUrl = tabs[0].url;
    if (!currentUrl || currentUrl.startsWith('chrome://')) return;

    const cleanCurrentUrl = currentUrl.split('?')[0].replace(/\/$/, '');

    const result = await chrome.storage.local.get(['applications']);
    const applications = result.applications || [];

    const hasApplied = applications.some(app => {
      if (!app.url) return false;
      const cleanAppUrl = app.url.split('?')[0].replace(/\/$/, '');
      return cleanCurrentUrl === cleanAppUrl;
    });

    if (hasApplied) {
      document.getElementById('alreadyAppliedBadge').classList.remove('hidden');

      // Update the apply button visually
      applyBtn.style.backgroundColor = '#4b5563'; // gray-600
      applyBtn.style.borderColor = '#374151'; // gray-700
      document.querySelector('#applyBtn .btn-text').textContent = 'Update Application';
    }
  } catch (error) {
    console.error('Failed to check already applied status:', error);
  }
}

// Check connection to backend
async function checkConnection() {
  const userStatusDiv = document.getElementById('userStatus');
  const statusDot = userStatusDiv.querySelector('.status-dot');
  const userEmailSpan = userStatusDiv.querySelector('.user-email');

  try {
    const baseUrl = CONFIG.BACKEND_URL;
    const statsUrl = baseUrl + '/api/stats';

    const headers = {};
    if (CONFIG.IS_DEV) headers['x-dev-extension'] = 'true';

    const response = await fetch(statsUrl, {
      credentials: 'include',
      headers
    });

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

// Auto-export toggle — save immediately on change
document.getElementById('autoExport').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ autoExport: e.target.checked });
  showStatus(e.target.checked ? 'Auto-export enabled' : 'Auto-export disabled', 'success');
});

// Open Dashboard
openDashboardBtn.addEventListener('click', () => {
  window.open(CONFIG.BACKEND_URL, '_blank');
});

// Open Privacy Policy
const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
if (privacyPolicyBtn) {
  privacyPolicyBtn.addEventListener('click', () => {
    window.open(CONFIG.BACKEND_URL + '/privacy', '_blank');
  });
}
