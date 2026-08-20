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

/* ══════════════════════════════════════════════════════════════
   HANDSHAKE AUTOMATIQUE SITE ⇄ EXTENSION (remplace ID+Secret manuel)
   ────────────────────────────────────────────────────────────
   Le site (vidsparkpro.com, autorisé via externally_connectable dans
   manifest.json) déclenche ce protocole via chrome.runtime.sendMessage.
   Le nonce est généré ICI, gardé en local, et n'est révélé au backend
   qu'à l'étape finale (handshake/complete) — le site ne voit jamais que
   son empreinte SHA-256 ("challenge"). Voir backend/src/routes/extensionPairing.js
   pour la validation serveur (state à usage unique, expiration 2 min).
══════════════════════════════════════════════════════════════ */
const HANDSHAKE_NONCE_TTL_MS = 2 * 60 * 1000;

async function sha256Hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Identifiant d'appareil persistant — même clé/format que content.js:getDeviceId(),
 * chrome.storage.local est partagé entre le service worker et les content scripts. */
function getDeviceId() {
  return new Promise(resolve => {
    chrome.storage.local.get("device_id", r => {
      if (r.device_id) return resolve(r.device_id);
      const id = "dev_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(36).slice(2));
      chrome.storage.local.set({ device_id: id }, () => resolve(id));
    });
  });
}

/** Étape 1 : le site demande un handshake → on génère le nonce (gardé local),
 *  on renvoie uniquement son empreinte. */
async function startHandshake() {
  const nonce = randomHex(32);
  const challenge = await sha256Hex(nonce);
  await chrome.storage.local.set({
    vs_handshake_nonce: nonce,
    vs_handshake_expires: Date.now() + HANDSHAKE_NONCE_TTL_MS
  });
  return challenge;
}

/** Étape 2 : le site relaie le `state` émis par le backend → on complète le
 *  handshake EN APPELANT LE BACKEND DIRECTEMENT (jamais via le site), avec le
 *  nonce brut gardé depuis l'étape 1. */
async function completeHandshake(state) {
  const { vs_handshake_nonce, vs_handshake_expires } = await chrome.storage.local.get(['vs_handshake_nonce', 'vs_handshake_expires']);
  await chrome.storage.local.remove(['vs_handshake_nonce', 'vs_handshake_expires']);

  if (!vs_handshake_nonce || !vs_handshake_expires || Date.now() > vs_handshake_expires) {
    throw new Error('NO_PENDING_HANDSHAKE');
  }
  if (!state || typeof state !== 'string') throw new Error('INVALID_STATE');

  const res = await fetch(`${BACKEND_URL}/auth/link/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: vs_handshake_nonce, state })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

  return completeRealActivation(body);
}

/** Code de secours à un seul champ (remplace la saisie manuelle ID+Secret). */
async function redeemManualCode(code) {
  const res = await fetch(`${BACKEND_URL}/auth/link/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

  return completeRealActivation(body);
}

/**
 * Étape finale, commune au handshake ET au code de secours : le pairing n'a
 * fait que résoudre le credential activation_id/secret STABLE existant du
 * compte (voir backend/src/routes/extensionPairing.js — find-or-create,
 * jamais un nouveau credential). C'est ICI, en appelant le VRAI système
 * d'activation (POST /api/activation/activate, totalement inchangé), que le
 * device-lock, la limite d'appareils par plan et la liste des chaînes
 * autorisées sont réellement appliqués — le pairing n'écrit jamais lui-même
 * dans activation_devices/activation_channels.
 */
async function completeRealActivation(credential) {
  const deviceId = await getDeviceId();
  const res = await fetch(`${BACKEND_URL}/activation/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      activation_id: credential.activation_id,
      activation_secret: credential.activation_secret,
      device_id: deviceId
    })
  });
  const body = await res.json().catch(() => ({}));

  /* vs_pairing_result : seul canal fiable pour prévenir le popup — la réponse
     de handshake/complete part vers la page SITE qui a déclenché l'appel
     externally_connectable, jamais vers le popup (contexte séparé). Le popup
     observe cette clé via chrome.storage.onChanged. */
  if (res.status === 403 && body.code === 'DEVICE_LOCKED') {
    const result = { status: 'device_locked', message: body.error, at: Date.now() };
    await chrome.storage.local.set({ vs_pairing_result: result });
    return { deviceLocked: true, message: body.error };
  }
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const channels = Array.isArray(body.channels) ? body.channels : [];

  await chrome.storage.local.set({
    activation_id: credential.activation_id,
    activation_secret: credential.activation_secret,
    subscription_expiry: body.subscription?.expiry || credential.subscription_expiry,
    userEmail: body.user?.email || credential.user?.email || '',
    userName: body.user?.name || credential.user?.name || '',
    userPlan: body.user?.plan || credential.user?.plan || 'free',
    authorizedChannelIds: Array.isArray(body.channel_ids) ? body.channel_ids : [],
    vs_pairing_result: { status: 'success', channels, at: Date.now() }
  });

  return { deviceLocked: false, channels, user: body.user || credential.user };
}

/* Messages EXTERNES : uniquement depuis les origines listées dans
   externally_connectable.matches (manifest.json) — Chrome filtre déjà les
   autres avant que ce listener ne soit appelé. */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message?.type === 'VIDSPARK_HANDSHAKE_REQUEST') {
    startHandshake()
      .then(challenge => sendResponse({ challenge }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (message?.type === 'VIDSPARK_HANDSHAKE_STATE') {
    completeHandshake(message.state)
      .then(result => sendResponse({
        success: !result.deviceLocked,
        deviceLocked: !!result.deviceLocked,
        message: result.message,
        channels: result.channels,
        user: result.user
      }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (message?.type === 'VIDSPARK_PING') {
    sendResponse({ pong: true, version: chrome.runtime.getManifest().version });
    return false;
  }
});

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

/**
 * 🔑 Récupère les identifiants d'activation depuis le compte connecté.
 *
 * Tout appel IA exige activation_id + activation_secret (voir callBackend plus
 * bas, qui lève `err_not_activated` sans eux). Ces deux valeurs vivaient
 * uniquement dans le formulaire de saisie manuelle : un utilisateur qui venait
 * de s'inscrire et de se connecter sur le site restait bloqué devant un panneau
 * lui réclamant un code, alors que le backend le lui aurait donné.
 *
 * `GET /user/me` ne renvoie ces identifiants QUE si une chaîne YouTube est
 * liée au compte (garde-fou serveur volontaire, commit dbffd8d). Sans chaîne
 * liée, on ne stocke rien et le panneau d'activation reste affiché — c'est le
 * comportement voulu, la chaîne se lie depuis le tableau de bord.
 */
async function syncActivationCredentials(token) {
  if (!token) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/user/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn("[Background] /user/me refused activation sync:", res.status);
      return false;
    }
    const me = await res.json();

    /* Stocké dans les deux cas : c'est la seule façon de distinguer « pas de
       chaîne liée » (→ à lier depuis le tableau de bord) de « pas de compte ».
       Le panneau d'activation ne l'exploite pas encore et propose la saisie
       manuelle dans les deux cas ; c'est le prochain écart à combler. */
    await chrome.storage.local.set({ youtubeConnected: !!me.youtube_connected });

    if (!me.activation_id || !me.activation_secret) {
      console.log("[Background] No activation credentials yet (channel linked:", !!me.youtube_connected, ")");
      return false;
    }

    await chrome.storage.local.set({
      activation_id: me.activation_id,
      activation_secret: me.activation_secret,
      subscription_expiry: me.subscription_expiry
    });
    console.log("[Background] ✅ Activation credentials synced from account");
    return true;
  } catch (e) {
    console.warn("[Background] Could not sync activation credentials:", e.message);
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // 🔑 Code de secours à un seul champ (remplace la saisie manuelle ID+Secret)
  if (message.type === "VIDSPARK_PAIR_REDEEM") {
    redeemManualCode(message.code)
      .then((result) => sendResponse({
        success: !result.deviceLocked,
        deviceLocked: !!result.deviceLocked,
        message: result.message,
        channels: result.channels,
        user: result.user
      }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 🔑 Resynchronisation manuelle des identifiants d'activation
  if (message.type === "VIDSPARK_SYNC_ACTIVATION") {
    chrome.storage.local.get("userToken", async ({ userToken }) => {
      const ok = await syncActivationCredentials(userToken);
      sendResponse({ success: ok });
    });
    return true;
  }

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
      await syncActivationCredentials(token);
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

/* Mappe les actions de l'extension vers les endpoints authentifiés par code */
const ACTION_ENDPOINTS = {
  titles:         "/activation/ai/titles",
  seo_report:     "/activation/ai/report",
  competitor:     "/activation/ai/competitor",
  description:    "/activation/ai/description",
  tags:           "/activation/ai/tags",
  yt_video:       "/activation/youtube/video",          // vraies données YouTube
  yt_competitors: "/activation/youtube/competitors",    // vrais concurrents
  growth_history: "/activation/youtube/growth-history", // historique de croissance de chaîne
  keywords:       "/activation/youtube/keywords",       // recherche de mots-clés
  channel_audit:  "/activation/youtube/channel-audit",  // audit de chaîne
  thumbnail:      "/activation/ai/thumbnail",           // analyse miniature IA
  thumbnail_gen:  "/activation/ai/thumbnail-generate",  // génération de miniature
  thumbnail_ideas:"/activation/ai/thumbnail-ideas",     // concepts de miniature (brief IA)
  abtest:         "/activation/ai/ab-test",             // A/B test IA (prédiction)
  shorts:         "/activation/ai/shorts",              // générateur de Shorts IA
  thumbnail_ab:   "/activation/ai/thumbnail-ab",        // A/B test de miniatures (Vision)
  hook:           "/activation/ai/hook",                // Hook Analyzer (rétention)
  audience:       "/activation/ai/audience",            // Optimiseur d'audience (région/langue)
  video_package:  "/activation/ai/video-package",       // Description complète + hashtags + tags
  revenue:        "/activation/ai/revenue",             // Estimateur vues + revenus
  channel_report: "/activation/ai/channel-report",      // Rapport de santé de chaîne (IA)
  comments:       "/activation/ai/comments",            // Analyse des commentaires
  chapters:       "/activation/ai/chapters",            // Chapitres horodatés
  ideas:          "/activation/ai/ideas",               // Générateur d'idées de vidéos
  title_doctor:   "/activation/ai/title-doctor",        // Coach CTR de titre
  sponsor:        "/activation/ai/sponsor",             // Kit sponsor & monétisation
  plan:           "/activation/ai/plan",                // Planificateur de contenu
  translate:      "/activation/ai/translate",           // Localisation / traduction
  community:      "/activation/ai/community",           // Posts communautaires
  script:         "/activation/ai/script",              // Générateur de script
  pair_check:     "/activation/ai/pair-check",          // Vérif Titre + Miniature
  playlists:      "/activation/ai/playlists",           // Optimiseur de playlists
  trends:         "/activation/ai/trends",              // Détecteur de tendances
  tiktok_seo:     "/activation/ai/tiktok-seo",          // SEO TikTok (légende, hooks, hashtags, script…)
  tiktok_tool:    "/activation/ai/tiktok-tool",         // Outils TikTok (idées, hooks, calendrier)
  tiktok_repurpose:"/activation/ai/tiktok-repurpose"    // YouTube→TikTok horodaté (timecodes)
};

async function handleRequest({ action, videoId, title, description, language, query, channelId, prompt, titleA, titleB, transcript, imageA, imageB, script, target, content_language, niche, region, subscribers, stats, topic, opportunity, avg_views, frequency, target_lang, duration, no_text, tool, fresh }) {

  // `fresh` : l'appelant exige une lecture à jour (écran Suivi — des vues vieilles
  // de 24 h y seraient trompeuses). Le cache est ignoré en lecture, pas en écriture.
  const noCache = fresh === true || ["thumbnail_gen","thumbnail_ideas","abtest","shorts","thumbnail_ab","hook","audience","video_package","revenue","channel_report","comments","chapters","ideas","title_doctor","sponsor","plan","translate","community","script","pair_check","playlists","trends","tiktok_seo","tiktok_tool","tiktok_repurpose","growth_history"].includes(action) || (action === "keywords" && opportunity);  // toujours regénérer
  const cacheKey = `cache:${action}:${videoId || ""}:${(query || "").slice(0, 50)}:${(channelId || "")}:${language || "fr"}`;
  if (!noCache) {
    const cached = await getFromCache(cacheKey);
    if (cached) return { ...cached, fromCache: true };
  }

  const endpoint = ACTION_ENDPOINTS[action];
  // Le service worker n'a pas le dictionnaire : il renvoie une CLÉ i18n que
  // content.js traduit à l'affichage (errText).
  if (!endpoint) throw new Error("err_soon");

  const { activation_id, activation_secret } = await chrome.storage.local.get(["activation_id", "activation_secret"]);
  if (!activation_id || !activation_secret) throw new Error("err_not_activated");

  const response = await fetch(BACKEND_URL + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activation_id, activation_secret, title, description, language, videoId, query, channelId, prompt, titleA, titleB, transcript, imageA, imageB, script, target, content_language, niche, region, subscribers, stats, topic, opportunity, avg_views, frequency, target_lang, duration, no_text, tool })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Erreur réseau" }));
    if (response.status === 403 && err.code === "UPGRADE_REQUIRED") {
      throw new Error(err.error || "err_upgrade");
    }
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!noCache) await saveToCache(cacheKey, data);
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
