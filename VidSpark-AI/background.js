/**
 * VidSpark AI v5.0 — Background Service Worker
 * Authentification Google UNIQUEMENT + Sélection chaîne YouTube
 * Manifest V3 + chrome.identity.launchWebAuthFlow
 */
"use strict";

const CONFIG = {
  BACKEND_URL: "http://localhost:3001/api",
  UPGRADE_URL: "https://vidsparkpro.com"
};

const CACHE_TTL = 60 * 60 * 1000; // 1h

/* ── Message listener pour communication avec content.js et popups ── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "VIDSPARK_API_REQUEST") {
    handleAPIRequest(msg.payload)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "VIDSPARK_AUTH") {
    handleAuth(msg.payload)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "VIDSPARK_CHECK_PLAN") {
    checkUserPlan()
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "VIDSPARK_GET_CONFIG") {
    sendResponse({
      upgrade_url: CONFIG.UPGRADE_URL,
      backend_url: CONFIG.BACKEND_URL
    });
    return false;
  }

  if (msg.type === "VIDSPARK_CHECK_AUTH") {
    checkAuthentication()
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "VIDSPARK_OPEN_ONBOARDING") {
    console.log("[VidSpark Background] Opening onboarding popup");
    chrome.windows.create({
      url: chrome.runtime.getURL('onboarding.html'),
      type: 'popup',
      width: 500,
      height: 700
    });
    sendResponse({ success: true });
    return false;
  }

  /* ── Message depuis le site web (vidsparkpro.com) pour sauvegarder l'authentification ── */
  if (msg.type === "VIDSPARK_SET_AUTH") {
    console.log("[VidSpark Background] Received authentication from website");
    const { accessToken, currentUser, tokenExpiry, is_new_user } = msg.payload;

    // Sauvegarder dans Chrome storage
    chrome.storage.local.set({
      accessToken: accessToken,
      currentUser: currentUser,
      tokenExpiry: tokenExpiry,
      onboardingComplete: !is_new_user  // Si nouveau user, onboarding pas complété
    });

    if (is_new_user) {
      // Nouveau utilisateur → rediriger vers onboarding sur le site
      console.log("[VidSpark] New user detected, redirecting to onboarding");
      chrome.tabs.create({
        url: "https://vidsparkpro.com/onboarding"
      });
    } else {
      // Utilisateur existant → fermer la popup login
      console.log("[VidSpark] Existing user, ready to use extension");
    }

    sendResponse({ success: true });
    return false;
  }
});

/* ── Au démarrage/installation de l'extension ── */
chrome.runtime.onInstalled.addListener(() => {
  console.log("[VidSpark] Extension installed/updated");

  // Au premier lancement, diriger vers le site web pour authentification
  chrome.storage.local.get(['accessToken', 'currentUser'], (result) => {
    if (!result.accessToken) {
      console.log("[VidSpark] First launch detected, opening login page on website");
      // Ouvrir le site web pour authentification
      chrome.tabs.create({
        url: "https://vidsparkpro.com/login"
      });
    }
  });

  console.log("[VidSpark] Backend URL: " + CONFIG.BACKEND_URL);
});

/* ══════════════════════════════════════════════════════════════
   AUTHENTIFICATION GOOGLE OAUTH - Manifest V3
══════════════════════════════════════════════════════════════ */

/**
 * Vérifier si l'utilisateur est authentifié
 */
async function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['accessToken', 'currentUser', 'onboardingComplete', 'primaryChannelId'],
      (result) => {
        const authenticated = !!result.accessToken && result.onboardingComplete;
        const hasPrimaryChannel = !!result.primaryChannelId;

        resolve({
          authenticated,
          hasPrimaryChannel,
          token: result.accessToken,
          user: result.currentUser,
          primaryChannelId: result.primaryChannelId
        });
      }
    );
  });
}

/**
 * Récupérer le token valide (refresh si expiré)
 */
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["accessToken", "tokenExpiry"], (data) => {
      if (!data.accessToken) return resolve(null);

      // Vérifier si token expiré
      if (data.tokenExpiry && Date.now() > data.tokenExpiry) {
        console.log("[VidSpark] Token expired, attempting refresh");
        refreshToken()
          .then(resolve)
          .catch(() => {
            console.error("[VidSpark] Token refresh failed");
            resolve(null);
          });
        return;
      }

      resolve(data.accessToken);
    });
  });
}

/**
 * Refresh le token d'accès
 */
async function refreshToken() {
  return new Promise(async (resolve, reject) => {
    chrome.storage.local.get(["refreshToken"], async (data) => {
      if (!data.refreshToken) {
        console.error("[VidSpark] No refresh token available");
        return reject(new Error("No refresh token"));
      }

      try {
        const res = await fetch(CONFIG.BACKEND_URL + "/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: data.refreshToken })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        const expiry = Date.now() + (result.expires_in || 3600) * 1000;
        chrome.storage.local.set({
          accessToken: result.access_token,
          refreshToken: result.refresh_token || data.refreshToken,
          tokenExpiry: expiry
        });

        console.log("[VidSpark] Token refreshed successfully");
        resolve(result.access_token);
      } catch (err) {
        console.error("[VidSpark] Token refresh error:", err.message);
        // Clear invalid tokens
        chrome.storage.local.remove([
          "accessToken",
          "refreshToken",
          "tokenExpiry",
          "currentUser",
          "userPlan",
          "planCache",
          "planCacheTime"
        ]);
        reject(err);
      }
    });
  });
}

/**
 * Handler principal pour l'authentification Google OAuth
 * Utilise chrome.identity.launchWebAuthFlow (Manifest V3 compatible)
 */
async function handleAuth(payload) {
  const { action } = payload;

  // Logout
  if (action === "logout") {
    console.log("[VidSpark Auth] Logout requested");
    chrome.storage.local.remove([
      "accessToken",
      "refreshToken",
      "tokenExpiry",
      "currentUser",
      "userPlan",
      "planCache",
      "planCacheTime",
      "primaryChannelId",
      "primaryChannelName",
      "onboardingComplete"
    ]);
    return { success: true, message: "Logged out" };
  }

  // Google OAuth Login
  if (action === "google") {
    console.log("[VidSpark OAuth] Starting Google authentication");

    try {
      // 1. Récupérer le Client ID du manifest.json
      const clientId = chrome.runtime.getManifest().oauth2?.client_id;
      if (!clientId || clientId.includes("REMPLACEZ")) {
        throw new Error(
          "Google Client ID not configured in manifest.json. Please set oauth2.client_id with your Google Cloud OAuth 2.0 Client ID."
        );
      }
      console.log("[VidSpark OAuth] Client ID loaded from manifest");

      // 2. Obtenir la redirect URI (généré automatiquement par Chrome)
      const redirectUri = chrome.identity.getRedirectURL();
      console.log("[VidSpark OAuth] Redirect URI:", redirectUri);

      // 3. Générer nonce pour sécurité
      const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);

      // 4. Construire l'URL d'authentification Google
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("response_type", "id_token");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set(
        "scope",
        "openid email profile"
      );
      authUrl.searchParams.set("nonce", nonce);
      authUrl.searchParams.set("prompt", "select_account");

      console.log("[VidSpark OAuth] Auth URL constructed, launching flow");

      // 5. Lancer le flux OAuth avec launchWebAuthFlow
      const responseUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          { url: authUrl.toString(), interactive: true },
          (url) => {
            if (chrome.runtime.lastError) {
              console.error("[VidSpark OAuth] Chrome error:", chrome.runtime.lastError.message);
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log("[VidSpark OAuth] Auth flow completed, parsing response");
              resolve(url);
            }
          }
        );
      });

      // 6. Parser la réponse (extraire id_token du hash)
      const params = new URLSearchParams(new URL(responseUrl).hash.slice(1));
      const id_token = params.get("id_token");
      if (!id_token) {
        throw new Error(
          "Google id_token not received. Possible causes: redirect_uri_mismatch, invalid Client ID, or user cancelled."
        );
      }
      console.log("[VidSpark OAuth] id_token received successfully");

      // 7. Envoyer id_token au backend pour création auto du compte
      console.log("[VidSpark Auth] Sending id_token to backend for account creation");
      const res = await fetch(CONFIG.BACKEND_URL + "/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Backend rejected authentication");
      }

      console.log("[VidSpark Auth] Backend authentication successful");

      // 8. Sauvegarder les credentials localement
      if (data.access_token) {
        const expiry = Date.now() + (data.expires_in || 3600) * 1000;
        chrome.storage.local.set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenExpiry: expiry,
          currentUser: data.user,
          userPlan: data.user?.plan || "free"
        });
        console.log("[VidSpark Auth] Credentials stored in chrome.storage");

        // 9. Si pas de chaîne YouTube sélectionnée, ouvrir le sélecteur
        if (!data.user?.primary_channel_id) {
          console.log("[VidSpark Auth] No primary channel found, opening channel selector");
          chrome.windows.create({
            url: chrome.runtime.getURL('channel-select.html'),
            type: 'popup',
            width: 520,
            height: 600
          });
        } else {
          console.log("[VidSpark Auth] Primary channel already set:", data.user.primary_channel_id);
        }
      }

      return data;
    } catch (err) {
      console.error("[VidSpark OAuth Error]", err.message);
      throw err;
    }
  }

  throw new Error("Unsupported auth action: " + action);
}

/* ══════════════════════════════════════════════════════════════
   VÉRIFICATION PLAN (côté serveur)
══════════════════════════════════════════════════════════════ */

async function checkUserPlan() {
  const token = await getToken();
  if (!token) {
    return { plan: "free", authenticated: false };
  }

  // Vérifier le cache (1h)
  const cached = await new Promise((r) =>
    chrome.storage.local.get(["planCache", "planCacheTime"], r)
  );

  if (
    cached.planCache &&
    cached.planCacheTime &&
    Date.now() - cached.planCacheTime < 60 * 60 * 1000
  ) {
    // Vérifier l'expiration du plan même en cache
    const planData = cached.planCache;
    if (["pro", "business"].includes(planData.plan) && planData.plan_expiration) {
      const expiration = new Date(planData.plan_expiration);
      if (expiration < new Date()) {
        console.log("[VidSpark Plan] Cached plan expired, clearing cache");
        chrome.storage.local.remove(["planCache", "planCacheTime"]);
        return checkUserPlan();
      }
    }
    return planData;
  }

  try {
    const res = await fetch(CONFIG.BACKEND_URL + "/user/plan", {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("Plan check failed");
    const data = await res.json();

    // Vérifier l'expiration
    if (["pro", "business"].includes(data.plan) && data.plan_expiration) {
      const expiration = new Date(data.plan_expiration);
      if (expiration < new Date()) {
        console.log("[VidSpark Plan] Plan expired, resetting to free");
        data.plan = "free";
        data.subscription_status = "expired";
      }
    }

    chrome.storage.local.set({ planCache: data, planCacheTime: Date.now() });
    chrome.storage.local.set({ userPlan: data.plan });

    // Notify all tabs about plan change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'PLAN_UPDATED',
          plan: data.plan
        }).catch(err => {
          // Tab might not have content script loaded, ignore
        });
      });
    });

    return { ...data, authenticated: true };
  } catch (err) {
    console.error("[VidSpark Plan Check]", err.message);
    return { plan: "free", authenticated: !!token };
  }
}

/* ══════════════════════════════════════════════════════════════
   PROXY API - Requêtes IA
══════════════════════════════════════════════════════════════ */

async function handleAPIRequest(payload) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const endpoints = {
    seo_report: "/ai/seo-report",
    titles: "/ai/titles",
    description: "/ai/description",
    tags: "/ai/tags"
  };

  const endpoint = endpoints[payload.action];
  if (!endpoint) throw new Error("Unknown action: " + payload.action);

  const res = await fetch(CONFIG.BACKEND_URL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      videoId: payload.videoId,
      title: payload.title,
      description: payload.description,
      language: payload.language || "fr"
    })
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 403) throw new Error("UPGRADE_REQUIRED");
    if (res.status === 429) throw new Error("QUOTA_EXCEEDED");
    throw new Error(data.error || "API error");
  }

  return data;
}

/* ── Alarm pour refresh plan (toutes les heures) ── */
chrome.alarms.create("refreshPlan", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshPlan") {
    console.log("[VidSpark] Refreshing plan cache");
    chrome.storage.local.remove(["planCache", "planCacheTime"]);
  }
});
