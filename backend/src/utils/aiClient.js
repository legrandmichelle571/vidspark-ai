/**
 * Client IA partagé (Google Gemini) + générateurs de contenu.
 * La clé API reste côté serveur uniquement (process.env.GEMINI_API_KEY).
 */

async function callGemini(prompt, maxTokens = 2048) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const key   = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY manquante');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens:  maxTokens,
      temperature:      0.8,
      responseMimeType: 'application/json',      // force une sortie JSON propre
      thinkingConfig:   { thinkingBudget: 0 }    // désactive le "thinking" (sinon le JSON est tronqué)
    }
  });

  let lastErr = 'Gemini indisponible';
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const err = await response.json().catch(() => ({}));
    lastErr = err.error?.message || `Gemini API error ${response.status}`;

    // Retry automatique sur surcharge / rate limit
    if (response.status === 503 || response.status === 429 || /high demand|overloaded|unavailable/i.test(lastErr)) {
      await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
      continue;
    }
    throw new Error(lastErr);
  }
  throw new Error(lastErr);
}

function parseJson(text) {
  let t = (text || '').replace(/```json|```/g, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');   // extrait le bloc JSON si entouré de texte
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  try {
    return JSON.parse(t);
  } catch (err) {
    return repairJson(t);
  }
}

/* Répare un JSON tronqué : coupe le token incomplet de fin, puis ferme
   les accolades/crochets ouverts dans le bon ordre (pile). */
function repairJson(t) {
  const stack = [];
  let inStr = false, esc = false, lastSafe = -1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') { stack.pop(); lastSafe = i; }
    else if (c === ',') lastSafe = i - 1;   // après une valeur complète
    else if (/[\d"truefalsn]/.test(c)) lastSafe = i; // fin probable d'une valeur
  }
  // Couper après le dernier token complet, retirer une virgule traînante
  let body = lastSafe >= 0 ? t.slice(0, lastSafe + 1) : t;
  body = body.replace(/,\s*$/, '');
  // Recalculer la pile sur le corps tronqué
  const st = [];
  inStr = false; esc = false;
  for (const c of body) {
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') st.push('}');
    else if (c === '[') st.push(']');
    else if (c === '}' || c === ']') st.pop();
  }
  while (st.length) body += st.pop();
  return JSON.parse(body);
}

/* Génération de texte via Cloudflare Workers AI (Llama) — gratuit, sans quota Gemini */
async function callCloudflareText(prompt, maxTokens = 1200) {
  const acc = process.env.CF_ACCOUNT_ID, tok = process.env.CF_AI_TOKEN;
  if (!acc || !tok) throw new Error('Cloudflare non configuré');
  const model = process.env.CF_TEXT_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/${model}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }   // force une sortie JSON
    })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.result) throw new Error(j.errors?.[0]?.message || `Cloudflare AI ${r.status}`);
  const resp = j.result.response;
  return (resp && typeof resp === 'object') ? JSON.stringify(resp) : (resp || '');
}

/* JSON IA : Cloudflare d'abord (gratuit), Gemini en secours */
async function geminiJson(prompt, maxTokens) {
  // 1) Cloudflare Workers AI (pas de quota Gemini)
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    try { return parseJson(await callCloudflareText(prompt, maxTokens)); }
    catch (e) { /* on bascule sur Gemini */ }
  }
  // 2) Gemini (fallback)
  let lastErr;
  for (let i = 0; i < 2; i++) {
    try {
      return parseJson(await callGemini(prompt, maxTokens));
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 600));
    }
  }
  throw lastErr;
}

const LANG_NAMES = {
  fr:'français', en:'english', ar:'arabe', es:'espagnol',
  de:'allemand', ru:'russe', ja:'japonais', ko:'coréen', zh:'chinois',
  hi:'hindi', tr:'turc', nl:'néerlandais', it:'italien', pt:'portugais'
};

/* 5 variantes de titres optimisés */
async function generateTitles(title, language = 'fr') {
  const prompt = `Tu es un expert YouTube SEO et copywriter.
Génère 5 variantes de titres YouTube optimisés basés sur ce titre original : "${title}"

Chaque variante a un type différent. Réponds UNIQUEMENT en JSON valide :
{
  "titles": [
    {"text": "<titre version SEO>",      "hook": "SEO",      "score": <0-100>},
    {"text": "<titre version CTR>",       "hook": "CTR",      "score": <0-100>},
    {"text": "<titre version Virale>",    "hook": "Viral",    "score": <0-100>},
    {"text": "<titre version Curiosité>", "hook": "Curiosité","score": <0-100>},
    {"text": "<titre version Trending>",  "hook": "Trending", "score": <0-100>}
  ]
}
Langue: ${LANG_NAMES[language] || language}. Titres entre 55-70 caractères idéalement.`;
  return geminiJson(prompt, 2048);
}

/* Rapport SEO complet */
async function generateReport(title, description = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube SEO. Analyse ce titre et cette description en ${langName}.

Titre : "${title}"
Description (${description.length} caractères) : "${description.slice(0, 400)}"

Réponds UNIQUEMENT en JSON valide :
{
  "score": <0-100>,
  "viral_score": <0-100>,
  "viral_reason": "<analyse en ${langName}, 2-3 phrases>",
  "checklist": [
    {"item": "<problème ou point>", "detail": "<explication courte>", "status": "ok|fix"}
  ],
  "suggestions": ["<conseil concret 1 en ${langName}>", "<conseil 2>", "<conseil 3>", "<conseil 4>"]
}`;
  return geminiJson(prompt, 2048);
}

/* Description YouTube optimisée + hashtags */
async function generateDescription(title, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube SEO. Rédige une description YouTube optimisée en ${langName} pour la vidéo "${title}".
Réponds UNIQUEMENT en JSON valide :
{ "description": "<description engageante de 3 à 5 lignes, riche en mots-clés>", "hashtags": ["#mot1","#mot2","#mot3","#mot4","#mot5"] }`;
  return geminiJson(prompt, 1200);
}

/* 15 tags SEO */
async function generateTags(title, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Génère 15 tags YouTube SEO pertinents (mots-clés) pour la vidéo "${title}" en ${langName}.
Réponds UNIQUEMENT en JSON valide : { "tags": ["tag1","tag2","tag3", "..."] }`;
  return geminiJson(prompt, 800);
}

/* Analyse concurrentielle (basée IA) */
async function generateCompetitorInsights(title, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un stratège YouTube. Pour une vidéo intitulée "${title}", donne une analyse concurrentielle en ${langName}.
Réponds UNIQUEMENT en JSON valide :
{
  "niche": "<niche détectée>",
  "opportunities": ["<opportunité 1>", "<opportunité 2>", "<opportunité 3>"],
  "angles": ["<angle original 1>", "<angle original 2>"],
  "keywords": ["<mot-clé 1>", "<mot-clé 2>", "<mot-clé 3>", "<mot-clé 4>", "<mot-clé 5>"]
}`;
  return geminiJson(prompt, 1600);
}

/* A/B Test IA : prédit quelle variante (A ou B) performera le mieux */
async function compareTitles(titleA, titleB, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube spécialiste du taux de clics (CTR) et de la psychologie des audiences.
On te donne deux titres concurrents pour la MÊME vidéo. Prédis lequel obtiendra le meilleur CTR et explique pourquoi.

Titre A : "${titleA}"
Titre B : "${titleB}"

Évalue chaque titre sur : la curiosité, l'émotion, la clarté, les mots-clés SEO, et la longueur idéale.
Estime un CTR réaliste (%) pour chacun (entre 2% et 15% typiquement).

Réponds UNIQUEMENT en JSON valide :
{
  "winner": "A" ou "B",
  "confidence": <0-100, niveau de certitude>,
  "a": { "ctr_estimate": <nombre, ex 6.4>, "score": <0-100>, "strengths": ["<force 1>","<force 2>"], "weaknesses": ["<faiblesse 1>"] },
  "b": { "ctr_estimate": <nombre>, "score": <0-100>, "strengths": ["<force 1>","<force 2>"], "weaknesses": ["<faiblesse 1>"] },
  "verdict": "<explication en ${langName}, 2-3 phrases, du POURQUOI le gagnant l'emporte>",
  "improved": "<une 3e proposition de titre encore meilleure que A et B, en ${langName}>"
}
Langue de toutes les explications : ${langName}.`;
  return geminiJson(prompt, 1600);
}

/* Générateur de YouTube Shorts : transforme une vidéo longue / un sujet en idées de Shorts.
   opts = { transcript, hasTranscript, durationStr } pour proposer de vrais passages à couper. */
async function generateShorts(source, language = 'fr', opts = {}) {
  const langName = LANG_NAMES[language] || language;
  const { transcript = '', hasTranscript = false, durationStr = '' } = opts;

  const clipInstruction = hasTranscript
    ? `Voici la transcription horodatée de la vidéo (chaque ligne commence par [m:ss]) :
---
${transcript}
---
Pour chaque Short, identifie les VRAIS passages à découper en te basant sur cette transcription. Donne les timestamps de début/fin précis (en secondes) correspondant aux moments les plus forts.`
    : `Aucune transcription disponible (durée totale : ${durationStr || 'inconnue'}). Propose des passages ESTIMÉS répartis dans la vidéo, en marquant "estimated": true.`;

  const prompt = `Tu es un expert YouTube Shorts et monteur vidéo viral (formats < 60s).
À partir de cette vidéo : "${source}", génère 3 idées de Shorts à fort potentiel viral.

${clipInstruction}

Pour CHAQUE Short, fournis : un résumé, un titre accrocheur, un hook (3 premières sec), un script en plans courts, des hashtags, ET les passages exacts à couper dans la vidéo source (1 à 3 passages).

Réponds UNIQUEMENT en JSON valide :
{
  "shorts": [
    {
      "title": "<titre court et viral, max 50 caractères>",
      "summary": "<résumé en 1 phrase de ce que raconte ce Short>",
      "hook": "<phrase d'accroche des 3 premières secondes>",
      "script": ["<plan 1>", "<plan 2>", "<plan 3>"],
      "clips": [
        {"start_sec": <début en secondes>, "end_sec": <fin en secondes>, "reason": "<pourquoi ce passage>"}
      ],
      "estimated": <true si timestamps estimés, false si basés sur la transcription>,
      "hashtags": ["#short1", "#short2", "#short3"],
      "viral_score": <0-100>,
      "duration": "<durée conseillée, ex: 30s>"
    }
  ]
}
Toutes les explications en ${langName}. 3 Shorts variés (éducatif, émotionnel, surprenant). Les passages doivent rester dans la durée de la vidéo. Sois CONCIS pour garder un JSON complet et valide.`;
  return geminiJson(prompt, 3000);
}

/* Décrit une image via Cloudflare LLAVA (vision) */
async function cloudflareDescribeImage(imageBase64) {
  const acc = process.env.CF_ACCOUNT_ID, tok = process.env.CF_AI_TOKEN;
  if (!acc || !tok) throw new Error('Cloudflare non configuré');
  const bytes = [...Buffer.from(imageBase64, 'base64')];
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: bytes, prompt: 'Describe this YouTube thumbnail in detail: colors, text present, faces and emotions, composition, and how clickable it looks.', max_tokens: 300 })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.result) throw new Error(j.errors?.[0]?.message || `Cloudflare vision ${r.status}`);
  return j.result.description || '';
}

/* Analyse d'une miniature — Cloudflare (LLAVA décrit → Llama note en JSON), fallback Gemini Vision */
async function analyzeThumbnail(imageBase64, title = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;

  // 1) Cloudflare : LLAVA décrit l'image, puis Llama produit le JSON (gratuit, sans quota Gemini)
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    try {
      const desc = await cloudflareDescribeImage(imageBase64);
      if (desc) {
        const prompt = `Tu es un expert des miniatures YouTube (CTR). Voici la description d'une miniature (titre de la vidéo : "${title}") : "${desc}".
Réponds UNIQUEMENT en JSON valide :
{ "score": <0-100>, "strengths": ["<point fort 1>","<point fort 2>"], "tips": ["<conseil CTR 1>","<conseil 2>","<conseil 3>"], "has_text": <true|false>, "has_face": <true|false>, "emotion": "<émotion ou 'neutre'>" }
Langue : ${langName}.`;
        return await geminiJson(prompt, 900);
      }
    } catch (e) { /* on bascule sur Gemini Vision */ }
  }

  // 2) Fallback : Gemini Vision
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Analyse de miniature indisponible');
  const prompt = `Tu es un expert des miniatures YouTube (CTR). Analyse cette miniature (titre : "${title}") en ${langName}.
Réponds UNIQUEMENT en JSON : { "score": <0-100>, "strengths": ["..."], "tips": ["...","...","..."], "has_text": <true|false>, "has_face": <true|false>, "emotion": "<...>" }`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }] }],
      generationConfig: { maxOutputTokens: 1024, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
    })
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini ${r.status}`); }
  const d = await r.json();
  return parseJson(d.candidates?.[0]?.content?.parts?.[0]?.text || '');
}

/* Génère une image de miniature — GRATUIT via Pollinations.ai (pas de clé ni facturation)
   Renvoie { base64, mime }. */
async function generateThumbnailImage(prompt) {
  // 1) Cloudflare Workers AI (Flux) si configuré → qualité pro, 16:9, gratuit
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.CF_AI_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, steps: 6 }) }
    );
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.result?.image) return { base64: j.result.image, mime: 'image/jpeg' };
    // sinon on retombe sur Pollinations
  }

  // 2) Pollinations.ai (gratuit, sans clé) — tier gratuit : prompt + modèle uniquement
  //    (variation via le texte du prompt, car les paramètres seed/width déclenchent un 402)
  const varied = `${prompt} [v${Math.floor(Math.random() * 100000)}]`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(varied)}?model=flux`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Génération image ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2000) throw new Error('Image vide');
  return { base64: buf.toString('base64'), mime: r.headers.get('content-type') || 'image/jpeg' };
}

module.exports = { callGemini, generateTitles, generateReport, generateCompetitorInsights, generateDescription, generateTags, analyzeThumbnail, generateThumbnailImage, compareTitles, generateShorts };
