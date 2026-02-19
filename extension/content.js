// Content script for extracting job data from web pages
// Now simplified - just grab raw content and let LLM do ALL the parsing

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractJobData') {
        try {
            const jobData = extractPageContent();
            sendResponse({ success: true, data: jobData });
        } catch (error) {
            console.error('Extraction error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep message channel open for async response
});

// Extract raw page content for LLM to parse
function extractPageContent() {
    const url = window.location.href;
    const pageTitle = document.title;

    // Detect job board for context
    const jobBoard = detectJobBoard(url);

    // Get the main content area (try to avoid headers/footers/navigation)
    let mainContent = '';

    // Strategy: Capture EVERYTHING visible. The LLM is smart enough to filter noise.
    // We clone the body to avoid modifying the actual page
    const clone = document.body.cloneNode(true);

    // Remove scripts, styles, and hidden elements to reduce noise
    const noiseSelectors = ['script', 'style', 'noscript', 'iframe', 'svg', '[hidden]', '[aria-hidden="true"]'];
    noiseSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Get text content
    mainContent = clone.innerText || clone.textContent;

    // Clean up excessive whitespace
    mainContent = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

    // Limit content length to avoid token limits (keep first 25000 chars)
    if (mainContent.length > 25000) {
        mainContent = mainContent.substring(0, 25000) + '...';
    }

    return {
        url: url,
        pageTitle: pageTitle,
        jobBoard: jobBoard,
        pageContent: mainContent,
        timestamp: new Date().toISOString()
    };
}

// Detect which job board we're on (for context)
function detectJobBoard(url) {
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('indeed.com')) return 'Indeed';
    if (url.includes('glassdoor.com')) return 'Glassdoor';
    if (url.includes('greenhouse.io')) return 'Greenhouse';
    if (url.includes('lever.co')) return 'Lever';
    if (url.includes('workday.com')) return 'Workday';
    if (url.includes('monster.com')) return 'Monster';
    if (url.includes('ziprecruiter.com')) return 'ZipRecruiter';
    return 'Generic';
}
