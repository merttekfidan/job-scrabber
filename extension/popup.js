// DOM Elements
const applyBtn = document.getElementById('applyBtn');
const exportBtn = document.getElementById('exportBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const apiKeyInput = document.getElementById('apiKey');
const sheetsUrlInput = document.getElementById('sheetsUrl');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const openSheetBtn = document.getElementById('openSheetBtn');
const statusDiv = document.getElementById('status');
const lastCaptureDiv = document.getElementById('lastCapture');
const totalAppsSpan = document.getElementById('totalApps');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateStats();
  await loadLastCapture();
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get(['groqApiKey', 'sheetsWebAppUrl', 'autoExport']);
  if (result.groqApiKey) {
    apiKeyInput.value = result.groqApiKey;
  }
  if (result.sheetsWebAppUrl) {
    sheetsUrlInput.value = result.sheetsWebAppUrl;
    openSheetBtn.classList.remove('hidden');
  } else {
    // Default to production URL
    sheetsUrlInput.value = 'https://aware-endurance-production-13b8.up.railway.app/api/save';
  }
  if (result.autoExport) {
    document.getElementById('autoExport').checked = result.autoExport;
  }
}

// Update statistics
async function updateStats() {
  const result = await chrome.storage.local.get(['applications']);
  const apps = result.applications || [];
  totalAppsSpan.textContent = `${apps.length} application${apps.length !== 1 ? 's' : ''} tracked`;
}

// Load last capture info
async function loadLastCapture() {
  const result = await chrome.storage.local.get(['lastCapture']);
  if (result.lastCapture) {
    const capture = result.lastCapture;
    lastCaptureDiv.querySelector('.capture-title').textContent = capture.jobTitle;
    lastCaptureDiv.querySelector('.capture-company').textContent = capture.company;
    lastCaptureDiv.querySelector('.capture-time').textContent = new Date(capture.timestamp).toLocaleString();
    lastCaptureDiv.classList.remove('hidden');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.className = `status ${type}`;
  statusDiv.querySelector('.status-text').textContent = message;

  const icons = {
    info: '⏳',
    success: '✓',
    error: '✗'
  };
  statusDiv.querySelector('.status-icon').textContent = icons[type] || '⏳';

  statusDiv.classList.remove('hidden');

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 5000);
  }
}

// Apply button click handler
applyBtn.addEventListener('click', async () => {
  try {
    // Check if API key is set
    const result = await chrome.storage.local.get(['groqApiKey']);
    if (!result.groqApiKey) {
      showStatus('Please set your Groq API key in settings', 'error');
      settingsPanel.classList.remove('hidden');
      return;
    }

    // Disable button and show processing state
    applyBtn.classList.add('processing');
    applyBtn.disabled = true;
    showStatus('Extracting job data...', 'info');

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject and execute content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Send message to content script to extract data
    chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' }, async (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Failed to extract data from page', 'error');
        applyBtn.classList.remove('processing');
        applyBtn.disabled = false;
        return;
      }

      if (response && response.success) {
        showStatus('Processing with AI...', 'info');

        // Send to background script for Gemini processing
        chrome.runtime.sendMessage({
          action: 'processJobData',
          data: response.data
        }, async (processResponse) => {
          if (processResponse && processResponse.success) {
            showStatus('Job application saved!', 'success');
            await updateStats();
            await loadLastCapture();

            // Auto-export if enabled
            const settings = await chrome.storage.local.get(['autoExport']);
            if (settings.autoExport) {
              exportToCSV();
            }
          } else {
            showStatus(processResponse?.error || 'Failed to process job data', 'error');
          }

          applyBtn.classList.remove('processing');
          applyBtn.disabled = false;
        });
      } else {
        showStatus(response?.error || 'Failed to extract job data', 'error');
        applyBtn.classList.remove('processing');
        applyBtn.disabled = false;
      }
    });

  } catch (error) {
    console.error('Error:', error);
    showStatus('An error occurred', 'error');
    applyBtn.classList.remove('processing');
    applyBtn.disabled = false;
  }
});

// Export to CSV
exportBtn.addEventListener('click', exportToCSV);

async function exportToCSV() {
  try {
    const result = await chrome.storage.local.get(['applications']);
    const apps = result.applications || [];

    if (apps.length === 0) {
      showStatus('No applications to export', 'error');
      return;
    }

    // Create CSV content
    const headers = [
      'Timestamp',
      'Job Title',
      'Company',
      'Location',
      'Work Mode',
      'Salary',
      'Status',
      'Job URL',
      'Company URL',
      'Key Responsibilities',
      'Required Skills',
      'Preferred Skills',
      'Company Notes',
      'Interview Prep Notes',
      'Questions to Ask',
      'Source',
      'Applied Date'
    ];

    const rows = apps.map(app => [
      app.applicationDate,
      app.jobTitle,
      app.company,
      app.location || '',
      app.workMode || '',
      app.salary || '',
      app.status,
      app.jobUrl,
      app.companyUrl || '',
      app.keyResponsibilities?.join('; ') || '',
      app.requiredSkills?.join('; ') || '',
      app.preferredSkills?.join('; ') || '',
      app.companyDescription || '',
      JSON.stringify(app.interviewPrepNotes || {}),
      app.interviewPrepNotes?.questionsToAsk?.join('; ') || '',
      app.metadata?.jobBoardSource || '',
      app.applicationDate
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showStatus('CSV exported successfully!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Failed to export CSV', 'error');
  }
}

// Settings toggle
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

// Save settings
saveApiKeyBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const sheetsUrl = sheetsUrlInput.value.trim();
  const autoExport = document.getElementById('autoExport').checked;

  if (!apiKey) {
    showStatus('Please enter a Groq API key', 'error');
    return;
  }

  await chrome.storage.local.set({
    groqApiKey: apiKey,
    sheetsWebAppUrl: sheetsUrl,
    autoExport: autoExport
  });

  // Show/hide Open Sheet button based on URL
  if (sheetsUrl) {
    openSheetBtn.classList.remove('hidden');
  } else {
    openSheetBtn.classList.add('hidden');
  }

  showStatus('Settings saved!', 'success');
  settingsPanel.classList.add('hidden');
});

// Open Google Sheet
openSheetBtn.addEventListener('click', async () => {
  const result = await chrome.storage.local.get(['sheetsWebAppUrl']);
  if (result.sheetsWebAppUrl) {
    // Extract sheet URL from Web App URL (it's returned in the response)
    // For now, just open script.google.com
    window.open('https://script.google.com/', '_blank');
    showStatus('Tip: Find your sheet in "My recent files"', 'info');
  }
});
