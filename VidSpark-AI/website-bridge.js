/**
 * VidSpark AI — Website Bridge
 * Content script qui run sur vidsparkpro.com
 * Détecte quand l'utilisateur se connecte et notifie l'extension
 */

console.log("[Website Bridge] Loaded on vidsparkpro.com");

/**
 * Écouter les changements du localStorage du site
 * Quand un token est sauvegardé après la connexion Google,
 * on notifie l'extension Chrome
 */

// Vérifier toutes les 2 secondes si un token a été défini
let lastToken = null;

setInterval(() => {
  try {
    // Lire le token depuis le localStorage du site web
    const token = localStorage.getItem('VIDSPARK_ACCESS_TOKEN');
    const user = localStorage.getItem('VIDSPARK_USER');
    const isNewUser = localStorage.getItem('VIDSPARK_IS_NEW_USER');

    // Si token détecté et c'est nouveau (pas déjà traité)
    if (token && token !== lastToken) {
      console.log("[Website Bridge] Token detected, notifying extension");
      lastToken = token;

      // Envoyer le message au background script de l'extension
      chrome.runtime.sendMessage({
        type: 'VIDSPARK_SET_AUTH',
        payload: {
          accessToken: token,
          currentUser: user ? JSON.parse(user) : null,
          tokenExpiry: localStorage.getItem('VIDSPARK_TOKEN_EXPIRY'),
          is_new_user: isNewUser === 'true'
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[Website Bridge] Extension not available:', chrome.runtime.lastError);
        } else {
          console.log('[Website Bridge] Auth notified to extension:', response);
        }
      });
    }
  } catch (err) {
    console.error('[Website Bridge] Error:', err);
  }
}, 2000);

/**
 * Aussi, écouter les post messages en cas de communication directe
 */
window.addEventListener('message', (event) => {
  // Accepter seulement les messages depuis vidsparkpro.com
  if (event.origin !== window.location.origin) return;

  if (event.data.type === 'VIDSPARK_AUTH_UPDATE') {
    console.log("[Website Bridge] Received post message auth update");

    // Relayer au background script de l'extension
    chrome.runtime.sendMessage({
      type: 'VIDSPARK_SET_AUTH',
      payload: event.data.payload
    });
  }
});
