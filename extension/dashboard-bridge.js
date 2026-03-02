/**
 * Runs only on HuntIQ dashboard (same origin). Fetches /api/auth/session
 * from the page context so cookies are sent — bypasses CORS for the extension.
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action !== 'getSession') return;
  fetch('/api/auth/session', { credentials: 'include' })
    .then((r) => r.json())
    .then((session) => sendResponse(session))
    .catch((err) => sendResponse({ error: err.message || 'Failed to fetch session' }));
  return true;
});
