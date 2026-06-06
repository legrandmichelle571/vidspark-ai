/**
 * VidSpark AI - Background Service Worker
 */

console.log('[VidSpark] Background worker loaded');

// Listener for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[VidSpark] Message received:', request);

  if (request.action === 'analyzeVideo') {
    // Handle video analysis
    sendResponse({ success: true, message: 'Video analysis started' });
  }
});

// Initialize extension (silencieusement, sans ouvrir de page)
chrome.runtime.onInstalled.addListener(() => {
  console.log('[VidSpark] Extension installed successfully');
  // Ne pas ouvrir de page automatiquement
});
