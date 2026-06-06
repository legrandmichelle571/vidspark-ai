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
 * Écouter les post messages du dashboard avec les infos d'authentification
 */
window.addEventListener('message', (event) => {
  console.log("[Website Bridge] Message received from:", event.origin, "Data:", event.data);

  // Accepter les messages depuis la même origine OU depuis le site principal
  if (event.origin !== window.location.origin && !event.origin.includes('pages.dev') && !event.origin.includes('vidsparkpro')) {
    console.log("[Website Bridge] Rejected - origin mismatch:", event.origin);
    return;
  }

  // LOGOUT — Nettoyer l'extension
  if (event.data.type === 'VIDSPARK_LOGOUT') {
    console.log("[Website Bridge] 🚪 Logout message received");

    // Relayer au background script pour nettoyer le storage
    chrome.runtime.sendMessage({
      type: 'VIDSPARK_LOGOUT'
    }, (response) => {
      console.log("[Website Bridge] Extension logged out");
    });

    return;
  }

  // AUTH — Mettre à jour l'authentification
  if (event.data.type === 'VIDSPARK_AUTH' || event.data.type === 'VIDSPARK_AUTH_UPDATE') {
    console.log("[Website Bridge] ✅ Auth message received:", event.data);

    // Relayer au background script de l'extension
    chrome.runtime.sendMessage({
      type: 'VIDSPARK_SET_AUTH',
      payload: {
        email: event.data.email,
        token: event.data.token,
        plan: event.data.plan,
        avatar: event.data.avatar,
        name: event.data.name,
        timestamp: event.data.timestamp
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Website Bridge] Extension error:', chrome.runtime.lastError);
      } else {
        console.log('[Website Bridge] Auth relayed successfully');
      }
    });
  }
});
