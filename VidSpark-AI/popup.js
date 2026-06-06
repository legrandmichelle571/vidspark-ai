/**
 * VidSpark AI — Popup Login
 * Redirige vers vidsparkpro.com pour l'authentification
 * Récupère le token automatiquement quand l'utilisateur revient
 */

const CONFIG = {
  SITE_URL: "https://vidsparkpro.com",
  BACKEND_URL: "http://localhost:3001/api"
};

// Au chargement de la popup
document.addEventListener('DOMContentLoaded', async () => {
  const loginBtn = document.getElementById('loginBtn');
  const loadingDiv = document.getElementById('loading');
  const loginDiv = document.getElementById('login');

  // Vérifier si déjà authentifié
  const auth = await checkAuthentication();

  if (auth.authenticated) {
    console.log("[Popup] User already authenticated");
    // Fermer la popup - l'utilisateur peut maintenant utiliser l'extension
    window.close();
    return;
  }

  // Afficher le bouton de login
  loginDiv.classList.remove('hide');
  loginDiv.classList.add('show');

  // Au click sur le bouton, ouvrir le site pour authentification
  loginBtn.addEventListener('click', () => {
    console.log("[Popup] Opening login page on vidsparkpro.com");
    chrome.tabs.create({
      url: CONFIG.SITE_URL + "/login"
    });

    // Montrer l'état "Authenticating..."
    loginDiv.classList.add('hide');
    loadingDiv.classList.add('show');

    // Vérifier toutes les 2 secondes si l'utilisateur a terminé l'authentification
    const authCheckInterval = setInterval(async () => {
      const result = await checkAuthentication();

      if (result.authenticated) {
        console.log("[Popup] Authentication successful!");
        clearInterval(authCheckInterval);

        // Attendre un peu pour que l'UI se mette à jour
        setTimeout(() => {
          window.close();
        }, 500);
      }
    }, 2000);

    // Arrêter la vérification après 10 minutes
    setTimeout(() => {
      clearInterval(authCheckInterval);
    }, 10 * 60 * 1000);
  });

  // Toutes les 5 secondes, vérifier si token arrive du site
  setInterval(async () => {
    const result = await checkAuthentication();
    if (result.authenticated) {
      console.log("[Popup] Token detected, closing popup");
      window.close();
    }
  }, 5000);
});

/**
 * Vérifier l'authentification depuis le storage Chrome
 */
async function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['accessToken', 'currentUser', 'onboardingComplete'],
      (result) => {
        const authenticated = !!result.accessToken;
        resolve({
          authenticated,
          token: result.accessToken,
          user: result.currentUser,
          onboardingComplete: result.onboardingComplete
        });
      }
    );
  });
}

/**
 * Récupérer le token du site web (via message cross-window)
 */
async function getTokenFromWebsite() {
  try {
    const response = await fetch(CONFIG.SITE_URL + "/api/get-token", {
      method: "GET",
      credentials: "include"  // Inclure les cookies
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        // Sauvegarder dans Chrome storage
        chrome.storage.local.set({
          accessToken: data.token,
          currentUser: data.user,
          tokenExpiry: data.tokenExpiry,
          onboardingComplete: true
        });
        return data.token;
      }
    }
  } catch (err) {
    console.error("[Popup] Failed to get token from website:", err);
  }
  return null;
}
