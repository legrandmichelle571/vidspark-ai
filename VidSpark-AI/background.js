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

  // 🔐 Message d'authentification du website-bridge
  if (message.type === "VIDSPARK_SET_AUTH") {
    console.log("[Background] Auth message received:", message.payload);

    // Stocker dans chrome.storage.local
    chrome.storage.local.set({
      userToken: message.payload.token,
      userPlan: message.payload.plan || 'free',
      userEmail: message.payload.email,
      userAvatar: message.payload.avatar || '',
      userName: message.payload.name || message.payload.email,
      authTimestamp: message.payload.timestamp || Date.now()
    }, () => {
      console.log("[Background] Auth stored in storage");
      sendResponse({ success: true, message: "Auth stored" });
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
