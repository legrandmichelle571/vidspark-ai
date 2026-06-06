/**
 * EchoRank AI — Cloudflare Worker Proxy
 * ─────────────────────────────────────
 * Rôle : intercepter toutes les requêtes IA de l'extension,
 * valider le token utilisateur, appliquer les quotas,
 * puis appeler l'API Anthropic (ou OpenAI) avec la vraie clé
 * stockée en secret dans Cloudflare — jamais exposée au client.
 *
 * Déploiement : wrangler deploy
 * Variables secrètes : wrangler secret put ANTHROPIC_API_KEY
 *                      wrangler secret put ECHORANK_SECRET
 */

const ALLOWED_ORIGINS = [
  "chrome-extension://VOTRE_EXTENSION_ID_ICI"
];

const RATE_LIMITS = {
  free:    { daily: 5,   hourly: 3  },
  starter: { daily: 50,  hourly: 20 },
  pro:     { daily: 500, hourly: 100 },
  business:{ daily: 9999,hourly: 999 }
};

const CACHE_TTL_SECONDS = 86400;

export default {
  async fetch(request, env, ctx) {

    if (request.method === "OPTIONS") {
      return corsResponse(null, 204, env);
    }

    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace("VOTRE_EXTENSION_ID_ICI", "")))) {
      if (!origin.startsWith("chrome-extension://")) {
        return corsResponse({ error: "Origine non autorisée" }, 403, env);
      }
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return corsResponse({ status: "ok", version: "2.0" }, 200, env);
    }

    const authHeader = request.headers.get("Authorization") || "";
    const userToken = authHeader.replace("Bearer ", "").trim();

    if (!userToken) {
      return corsResponse({ error: "Token manquant" }, 401, env);
    }

    const user = await validateToken(userToken, env);
    if (!user) {
      return corsResponse({ error: "Token invalide ou expiré" }, 401, env);
    }

    const quotaOk = await checkAndDecrementQuota(user, env);
    if (!quotaOk) {
      return corsResponse({
        error: "Quota journalier atteint",
        plan: user.plan,
        upgrade_url: "https://echorank.ai/upgrade"
      }, 429, env);
    }

    if (request.method !== "POST") {
      return corsResponse({ error: "Méthode non autorisée" }, 405, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse({ error: "Corps JSON invalide" }, 400, env);
    }

    const { action, videoId, title, description, language } = body;

    if (!action || !videoId || !title) {
      return corsResponse({ error: "Paramètres manquants: action, videoId, title requis" }, 400, env);
    }

    const cacheKey = `${user.plan}:${action}:${videoId}:${language || "fr"}`;
    const cached = await env.ECHORANK_CACHE.get(cacheKey);
    if (cached) {
      return corsResponse({ ...JSON.parse(cached), cached: true }, 200, env);
    }

    const prompt = buildPrompt(action, title, description, language);

    let result;
    try {
      result = await callAnthropic(prompt, env);
    } catch (err) {
      return corsResponse({ error: "Erreur API IA", detail: err.message }, 502, env);
    }

    ctx.waitUntil(
      env.ECHORANK_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: CACHE_TTL_SECONDS
      })
    );

    return corsResponse(result, 200, env);
  }
};

async function callAnthropic(prompt, env) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  let parsed;
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { raw: text };
  }

  return parsed;
}

function buildPrompt(action, title, description, language) {
  const lang = language || "Français";

  const prompts = {
    titles: `Tu es un expert YouTube SEO. Génère 5 titres SEO optimisés en ${lang} pour une vidéo intitulée: "${title}".
Réponds UNIQUEMENT en JSON valide, rien d'autre:
{"titles":[{"text":"...","score":85,"hook":"curiosité"},{"text":"...","score":82,"hook":"urgence"},{"text":"...","score":79,"hook":"chiffre"},{"text":"...","score":77,"hook":"question"},{"text":"...","score":75,"hook":"bénéfice"}]}`,

    description: `Tu es un expert YouTube SEO. Génère une description YouTube complète en ${lang} pour: "${title}".
Description de la vidéo: ${description?.slice(0, 300) || "N/A"}
Réponds UNIQUEMENT en JSON valide:
{"description":"[texte complet 800-1000 caractères avec keywords naturels, CTA, et 3 hashtags pertinents]","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]}`,

    tags: `Tu es un expert YouTube SEO. Génère 20 tags optimisés en ${lang} pour: "${title}".
Réponds UNIQUEMENT en JSON valide:
{"tags":["tag court 1","tag court 2","tag long phrase 1","tag long phrase 2"],"hashtags":["#hashtag1","#hashtag2","#hashtag3"]}`,

    seo_report: `Tu es un expert YouTube SEO. Analyse ce titre YouTube et fournis un rapport complet en ${lang}.
Titre: "${title}"
Description (extrait): "${description?.slice(0, 500) || "N/A"}"
Réponds UNIQUEMENT en JSON valide:
{"score":75,"checklist":[{"item":"Longueur titre (45-75 car.)","status":"ok","detail":"..."},{"item":"Mot-clé principal","status":"ok","detail":"..."},{"item":"Mot émotionnel","status":"fix","detail":"Suggestion: ajouter..."},{"item":"Hook CTR","status":"fix","detail":"Suggestion: commencer par..."},{"item":"Description riche","status":"ok","detail":"..."}],"suggestions":["suggestion 1","suggestion 2","suggestion 3"],"viral_score":65,"viral_reason":"..."}`,

    thumbnail_text: `Tu es un expert YouTube thumbnails. Analyse le titre "${title}" et suggère le texte idéal pour la miniature en ${lang}.
Réponds UNIQUEMENT en JSON valide:
{"thumbnail_text":"TEXTE COURT MAX 4 MOTS","color_scheme":"rouge et blanc","emotion":"surprise","tips":["conseil 1","conseil 2","conseil 3"]}`
  };

  return prompts[action] || prompts.seo_report;
}

async function validateToken(token, env) {
  if (token === "free_demo_token") {
    return { id: "demo", plan: "free", email: "demo@echorank.ai" };
  }

  try {
    const userData = await env.ECHORANK_CACHE.get(`user:${token}`);
    if (userData) return JSON.parse(userData);
  } catch {}

  return null;
}

async function checkAndDecrementQuota(user, env) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `quota:${user.id}:${today}`;
  const limits = RATE_LIMITS[user.plan] || RATE_LIMITS.free;

  let count = 0;
  try {
    const stored = await env.ECHORANK_CACHE.get(key);
    count = stored ? parseInt(stored) : 0;
  } catch {}

  if (count >= limits.daily) return false;

  await env.ECHORANK_CACHE.put(key, String(count + 1), {
    expirationTtl: 86400
  });

  return true;
}

function corsResponse(data, status, env) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-EchoRank-Version": "2.0"
  };

  return new Response(
    data !== null ? JSON.stringify(data) : null,
    { status, headers }
  );
}
