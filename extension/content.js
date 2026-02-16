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

    // Try to find main content container
    const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '#main-content',
        '.job-details',
        '.job-description',
        '.job-view-layout',
        'body'
    ];

    for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 200) {
            mainContent = element.textContent.trim();
            break;
        }
    }

    // Fallback to body if nothing found
    if (!mainContent) {
        mainContent = document.body.textContent.trim();
    }

    // Clean up the content (remove excessive whitespace)
    mainContent = mainContent
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .trim();

    // Limit content length to avoid token limits (keep first 8000 chars)
    if (mainContent.length > 8000) {
        mainContent = mainContent.substring(0, 8000) + '...';
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
