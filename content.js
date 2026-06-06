/**
 * VidSpark AI - Content Script
 * Injected into YouTube & VidSpark Site pages
 * Communicates between page and extension
 */

console.log('[VidSpark Content] Script loaded on:', window.location.href);

// Écouter les messages du site (via window.postMessage)
window.addEventListener('message', (event) => {
  // Seulement depuis notre site
  if (event.source !== window) return;

  console.log('[VidSpark Content] Message from page:', event.data);

  if (event.data.type === 'VIDSPARK_AUTH') {
    // L'utilisateur s'est connecté sur le site
    console.log('[VidSpark Content] Auth message received:', event.data.email);

    // Envoyer à background worker
    chrome.runtime.sendMessage({
      action: 'authSuccess',
      email: event.data.email,
      token: event.data.token
    }, (response) => {
      console.log('[VidSpark Content] Background response:', response);
    });

    // Répondre au site
    window.postMessage({
      type: 'VIDSPARK_AUTH_ACK',
      success: true
    }, '*');
  }
});

// Détecter les vidéos YouTube
function detectVideo() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (videoId) {
    console.log('[VidSpark Content] Detected video:', videoId);

    // Send message to background worker
    chrome.runtime.sendMessage({
      action: 'analyzeVideo',
      videoId: videoId,
      url: window.location.href,
      title: document.title
    }, (response) => {
      console.log('[VidSpark Content] Video analysis response:', response);
    });
  }
}

// Run on page load
if (window.location.href.includes('youtube.com')) {
  detectVideo();

  // Also detect when URL changes (SPA navigation)
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(detectVideo, 500);
  };
}
