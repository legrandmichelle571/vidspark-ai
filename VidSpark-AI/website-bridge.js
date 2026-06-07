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

function sendAuthToExtension(token, userRaw) {
  let user = {};
  try { user = userRaw ? JSON.parse(userRaw) : {}; } catch(e) {}
  chrome.runtime.sendMessage({
    type: 'VIDSPARK_SET_AUTH',
    payload: {
      token: token,           // clé principale
      accessToken: token,     // compatibilité
      email: user.email || user.name || '',
      name: user.name || user.email || '',
      avatar: user.avatar || user.picture || '',
      plan: user.plan || 'free',
      currentUser: user,
      timestamp: Date.now()
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Website Bridge] Extension not available:', chrome.runtime.lastError);
    } else {
      console.log('[Website Bridge] Auth notified to extension:', response);
    }
  });
}

setInterval(() => {
  try {
    const token = localStorage.getItem('VIDSPARK_ACCESS_TOKEN');
    const user  = localStorage.getItem('VIDSPARK_USER');

    if (token && token !== lastToken) {
      console.log("[Website Bridge] Token detected, notifying extension");
      lastToken = token;
      sendAuthToExtension(token, user);
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
    const token = event.data.token || event.data.accessToken;
    sendAuthToExtension(token, JSON.stringify({
      email: event.data.email,
      name: event.data.name,
      avatar: event.data.avatar,
      plan: event.data.plan
    }));
  }
});
