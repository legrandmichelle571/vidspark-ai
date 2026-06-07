/**
 * VidSpark AI — Background Service Worker
 * ────────────────────────────────────────
 * Rôle : relai sécurisé entre content.js et le backend.
 * Le token utilisateur est stocké ici (chrome.storage.local),
 * jamais dans le DOM ni dans content.js.
 */

const BACKEND_URL = "https://vidspark-ai-production-9ac7.up.railway.app/api";
const SITE_URL = "https://vidsparkpro.com";
const SUPABASE_URL = "https://fnhyskbisfbtjgblbiap.supabase.co";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

chrome.runtime.onInstalled.addListener(() => {
  console.log("VidSpark AI installée — redirection vers site de connexion");
  // Ouvrir le site de connexion automatiquement
  chrome.tabs.create({
    url: "https://vidsparkpro.com/dashboard.html"
  });
  // Initialiser le stockage
  chrome.storage.local.set({
    userToken: null,
    userPlan: "free",
    installDate: Date.now(),
    userEmail: null,
    userAvatar: null,
    userName: null
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // 🚪 Message de logout du website-bridge
  if (message.type === "VIDSPARK_LOGOUT") {
    console.log("[Background] 🚪 Logout received, clearing storage");

    chrome.storage.local.set({
      userToken: null,
      userPlan: 'free',
      userEmail: null,
      userAvatar: null,
      userName: null,
      authTimestamp: null
    }, () => {
      console.log("[Background] ✅ Storage cleared");
      sendResponse({ success: true, message: "Logged out" });
    });

    return true;
  }

  // 🔐 Message d'authentification du website-bridge
  if (message.type === "VIDSPARK_SET_AUTH") {
    console.log("[Background] Auth message received:", message.payload);
    // Compatibilité : website-bridge envoie 'accessToken', dashboard envoie 'token'
    const token = message.payload.token || message.payload.accessToken;
    const userObj = message.payload.currentUser || {};
    const email = message.payload.email || userObj.email || userObj.name || '';
    const name  = message.payload.name  || userObj.name  || userObj.email || email;
    const avatar= message.payload.avatar|| userObj.avatar|| userObj.picture || '';

    // Stocker dans chrome.storage.local
    chrome.storage.local.set({
      userToken: token,
      userPlan: message.payload.plan || 'free',
      userEmail: email,
      userAvatar: avatar,
      userName: name,
      authTimestamp: message.payload.timestamp || Date.now()
    }, async () => {
      console.log("[Background] Auth stored in storage");
      // Charger et stocker les chaînes autorisées localement
      try {
        const res = await fetch(`${BACKEND_URL}/channels/list`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const body = await res.json();
          const channelIds = (body.data || []).map(c => c.youtube_channel_id).filter(Boolean);
          await chrome.storage.local.set({ authorizedChannelIds: channelIds });
          console.log("[Background] Authorized channels stored:", channelIds);
        }
      } catch (e) {
        console.warn("[Background] Could not fetch channels:", e.message);
      }
      sendResponse({ success: true, message: "Auth stored" });
    });

    return true;
  }

  // 🔄 Recharger les chaînes autorisées manuellement
  if (message.type === "VIDSPARK_REFRESH_CHANNELS") {
    chrome.storage.local.get("userToken", async ({ userToken }) => {
      if (!userToken) { sendResponse({ success: false }); return; }
      try {
        const res = await fetch(`${BACKEND_URL}/channels/list`, {
          headers: { "Authorization": `Bearer ${userToken}` }
        });
        if (res.ok) {
          const body = await res.json();
          const channelIds = (body.data || []).map(c => c.youtube_channel_id).filter(Boolean);
          await chrome.storage.local.set({ authorizedChannelIds: channelIds });
          console.log("[Background] Channels refreshed:", channelIds);
          sendResponse({ success: true, channelIds });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    });
    return true;
  }

  // 🔒 Vérification de chaîne YouTube autorisée
  if (message.type === "VIDSPARK_VERIFY_CHANNEL") {
    chrome.storage.local.get("userToken", async ({ userToken }) => {
      if (!userToken) {
        sendResponse({ success: false, code: "NO_TOKEN" });
        return;
      }
      try {
        const response = await fetch(`${BACKEND_URL}/channels/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
          body: JSON.stringify({ youtube_channel_id: message.payload.channelId })
        });
        const data = await response.json();
        sendResponse({ success: response.ok, status: response.status, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  // Autres messages API
  if (!sender.tab) return;
  if (message.type !== "ECHORANK_API_REQUEST") return;

  handleRequest(message.payload)
    .then(sendResponse)
    .catch(err => sendResponse({ error: err.message }));

  return true;
});

async function handleRequest({ action, videoId, title, description, language }) {

  const cacheKey = `cache:${action}:${videoId}:${language || "fr"}`;
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const { userToken } = await chrome.storage.local.get("userToken");

  const response = await fetch(BACKEND_URL + "/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userToken}`
    },
    body: JSON.stringify({ action, videoId, title, description, language })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  await saveToCache(cacheKey, data);

  return data;
}

async function getFromCache(key) {
  try {
    const result = await chrome.storage.local.get(key);
    const entry = result[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      chrome.storage.local.remove(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function saveToCache(key, data) {
  try {
    await chrome.storage.local.set({
      [key]: { data, timestamp: Date.now() }
    });
  } catch {}
}

chrome.storage.local.get(null, (items) => {
  const now = Date.now();
  const keysToRemove = [];
  for (const [key, value] of Object.entries(items)) {
    if (key.startsWith("cache:") && value.timestamp) {
      if (now - value.timestamp > CACHE_TTL_MS) {
        keysToRemove.push(key);
      }
    }
  }
  if (keysToRemove.length > 0) {
    chrome.storage.local.remove(keysToRemove);
  }
});
