/**
 * Client IA partagé (Google Gemini) + générateurs de contenu.
 * La clé API reste côté serveur uniquement (process.env.GEMINI_API_KEY).
 */

/* Supprime le préfixe data-URI (data:image/png;base64,...) pour ne garder que le base64 brut.
   Gemini inlineData.data et Cloudflare exigent du base64 pur, sans préfixe. */
function stripDataUri(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/^data:[^;]+;base64,/, '').trim();
}

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

/* Texte IA brut (JSON string) : Cloudflare Workers AI d'abord (gratuit), Gemini en secours.
   Même préférence de fournisseur que geminiJson, mais renvoie le TEXTE (l'appelant parse). */
async function callTextAI(prompt, maxTokens = 1200) {
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    try { return await callCloudflareText(prompt, maxTokens); }
    catch (e) { /* on bascule sur Gemini */ }
  }
  return await callGemini(prompt, maxTokens);
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
    {"text": "<titre version SEO>",      "hook": "SEO",  "score": <0-100>},
    {"text": "<titre version CTR>",       "hook": "CTR",  "score": <0-100>},
    {"text": "<titre version Virale>",    "hook": "<le mot 'Viral' traduit en ${LANG_NAMES[language] || language}>",     "score": <0-100>},
    {"text": "<titre version Curiosité>", "hook": "<le mot 'Curiosité' traduit en ${LANG_NAMES[language] || language}>", "score": <0-100>},
    {"text": "<titre version Trending>",  "hook": "<le mot 'Trending' traduit en ${LANG_NAMES[language] || language}>",  "score": <0-100>}
  ]
}
"SEO" et "CTR" restent inchangés (acronymes universels). Langue: ${LANG_NAMES[language] || language}. Titres entre 55-70 caractères idéalement.`;
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

/* Title Doctor : diagnostic CTR d'un titre + mot manquant + version améliorée */
async function titleDoctor(title, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube du taux de clics (CTR). Diagnostique ce titre et améliore-le.
Titre : "${title}"

Réponds UNIQUEMENT en JSON valide :
{
  "score": <0-100, qualité CTR du titre>,
  "ctr_estimate": <CTR estimé en %, ex 6.5>,
  "missing": ["<élément manquant ou faible 1 en ${langName}>", "<élément 2>"],
  "improved": "<une version réécrite du titre, bien meilleure pour le CTR, en ${langName}, 50-70 caractères>",
  "tips": ["<conseil court 1 en ${langName}>", "<conseil 2>"]
}
Tout en ${langName}.`;
  return geminiJson(prompt, 900);
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

/* A/B Test de MINIATURES : décrit 2 images via Vision puis prédit celle qui aura le meilleur CTR */
async function compareThumbnails(imageA, imageB, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  imageA = stripDataUri(imageA);
  imageB = stripDataUri(imageB);

  // 1) Décrire les deux miniatures via Cloudflare LLAVA (vision)
  let descA = '', descB = '';
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    try {
      [descA, descB] = await Promise.all([
        cloudflareDescribeImage(imageA),
        cloudflareDescribeImage(imageB)
      ]);
    } catch (e) { /* on tentera Gemini Vision ci-dessous */ }
  }

  // 2) Si pas de description (CF indispo), comparer directement via Gemini Vision
  if (!descA || !descB) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Analyse de miniatures indisponible');
    const prompt = `Tu es un expert des miniatures YouTube (CTR). Compare ces DEUX miniatures (A = première image, B = seconde).
Prédis laquelle obtiendra le meilleur taux de clics et explique pourquoi (contraste, visage, émotion, lisibilité du texte, composition).
Réponds UNIQUEMENT en JSON : { "winner":"A"|"B","confidence":<0-100>,"a":{"ctr_estimate":<nb>,"score":<0-100>,"strengths":["..."],"weaknesses":["..."]},"b":{"ctr_estimate":<nb>,"score":<0-100>,"strengths":["..."],"weaknesses":["..."]},"verdict":"<en ${langName}>","tips":["<conseil pour améliorer la gagnante en ${langName}>"],"improve_prompt":"<prompt EN ANGLAIS, détaillé, pour générer via IA une version améliorée de la miniature gagnante : décris la scène, les couleurs vives, le texte gros et lisible, l'émotion du visage, le contraste élevé, format 16:9>" }`;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: imageA } },
          { inlineData: { mimeType: 'image/jpeg', data: imageB } }
        ] }],
        generationConfig: { maxOutputTokens: 1200, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
      })
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini ${r.status}`); }
    const d = await r.json();
    return parseJson(d.candidates?.[0]?.content?.parts?.[0]?.text || '');
  }

  // 3) Comparaison textuelle des deux descriptions (Llama, gratuit)
  const prompt = `Tu es un expert des miniatures YouTube (CTR). Voici la description de deux miniatures concurrentes.
Miniature A : "${descA}"
Miniature B : "${descB}"
Prédis laquelle obtiendra le meilleur taux de clics et explique pourquoi (contraste, visage, émotion, lisibilité du texte, composition).
Réponds UNIQUEMENT en JSON valide :
{
  "winner": "A" ou "B",
  "confidence": <0-100>,
  "a": { "ctr_estimate": <nombre, ex 6.4>, "score": <0-100>, "strengths": ["<force 1>","<force 2>"], "weaknesses": ["<faiblesse 1>"] },
  "b": { "ctr_estimate": <nombre>, "score": <0-100>, "strengths": ["<force 1>","<force 2>"], "weaknesses": ["<faiblesse 1>"] },
  "verdict": "<explication en ${langName}, 2-3 phrases>",
  "tips": ["<conseil pour rendre la miniature gagnante encore meilleure, en ${langName}>"],
  "improve_prompt": "<prompt EN ANGLAIS, détaillé, pour générer via IA une version améliorée de la miniature gagnante : décris la scène, les couleurs vives, le texte gros et lisible, l'émotion du visage, le contraste élevé, format 16:9>"
}`;
  return geminiJson(prompt, 1500);
}

/* Hook Analyzer : analyse le script d'intro et prédit la rétention + points de décrochage */
async function analyzeHook(script, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube de la RÉTENTION (le facteur #1 de l'algorithme).
On te donne le script de l'INTRODUCTION d'une vidéo (les premières secondes). Analyse-le et prédis où les spectateurs vont décrocher.

Script de l'intro :
"""
${script.slice(0, 1500)}
"""

Évalue : la force du hook (3 premières secondes), la promesse, le rythme, la clarté, et ce qui retient ou fait fuir.

Réponds UNIQUEMENT en JSON valide :
{
  "retention_estimate": <0-100, % estimé de spectateurs qui restent après l'intro>,
  "hook_score": <0-100>,
  "verdict": "<analyse globale en ${langName}, 2-3 phrases>",
  "drop_points": [
    {"quote": "<phrase exacte du script où le spectateur risque de partir>", "reason": "<pourquoi en ${langName}>", "severity": "high" ou "medium"}
  ],
  "strengths": ["<point fort 1>", "<point fort 2>"],
  "fixes": ["<correction concrète 1>", "<correction 2>", "<correction 3>"],
  "rewritten_hook": "<une version réécrite de l'intro, beaucoup plus accrocheuse, en ${langName}>"
}
Toutes les explications en ${langName}. Sois précis et actionnable.`;
  return geminiJson(prompt, 1800);
}

/* Génère des chapitres horodatés à partir de la transcription (prêts pour la description) */
async function generateChapters(transcript, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube. À partir de cette transcription horodatée (chaque ligne commence par [m:ss]), génère des CHAPITRES logiques pour la description de la vidéo.

Transcription :
"""
${(transcript || '').slice(0, 6000)}
"""

Règles YouTube : le 1er chapitre DOIT commencer à 0:00. Titres courts et clairs. Entre 4 et 10 chapitres.

Réponds UNIQUEMENT en JSON valide :
{
  "chapters": [
    {"time": "0:00", "title": "<titre du chapitre en ${langName}>"},
    {"time": "<m:ss>", "title": "<titre>"}
  ]
}
Titres en ${langName}.`;
  return geminiJson(prompt, 1200);
}

/* Analyse des commentaires : sentiment + demandes + idées de vidéos + réponses suggérées */
async function analyzeComments(comments = [], title = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const list = (comments || []).slice(0, 40)
    .map((c, i) => `${i + 1}. (${c.likes || 0}👍) ${c.text}`).join('\n');
  const prompt = `Tu es un expert de l'engagement YouTube. Analyse ces commentaires de la vidéo "${title}".

Commentaires :
"""
${list}
"""

Réponds UNIQUEMENT en JSON valide :
{
  "sentiment": { "positive": <% entier>, "neutral": <% entier>, "negative": <% entier> },
  "summary": "<résumé global du ressenti de l'audience en ${langName}, 2-3 phrases>",
  "themes": ["<sujet récurrent 1>", "<sujet 2>", "<sujet 3>"],
  "requests": ["<demande/attente récurrente de l'audience 1>", "<demande 2>", "<demande 3>"],
  "video_ideas": ["<idée de prochaine vidéo basée sur les commentaires 1>", "<idée 2>", "<idée 3>"],
  "suggested_replies": [
    {"comment": "<extrait court du commentaire>", "reply": "<réponse suggérée chaleureuse et engageante en ${langName}>"}
  ]
}
Donne 3 réponses suggérées pour les commentaires les plus importants. Tout en ${langName}. Les pourcentages de sentiment totalisent 100.`;
  return geminiJson(prompt, 1800);
}

/* Rapport de santé de chaîne : score + forces/faiblesses + recommandations à partir des stats d'audit */
async function generateChannelReport(stats = {}, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const s = stats || {};
  const prompt = `Tu es un consultant YouTube. Analyse la SANTÉ d'une chaîne à partir de ces statistiques réelles et donne un diagnostic actionnable.

Statistiques :
- Abonnés : ${s.subs ?? '?'}
- Vues totales : ${s.total_views ?? '?'}
- Nombre de vidéos : ${s.total_videos ?? '?'}
- Vues moyennes par vidéo : ${s.avg_views ?? '?'}
- Engagement moyen : ${s.avg_engagement ?? '?'}%
- Fréquence de publication : ${s.upload_freq_days ?? '?'} jours entre vidéos
- % de vidéos avec tags : ${s.tags_usage_pct ?? '?'}%
- Longueur moyenne des titres : ${s.avg_title_length ?? '?'} caractères

Réponds UNIQUEMENT en JSON valide :
{
  "health_score": <0-100, santé globale de la chaîne>,
  "summary": "<diagnostic global en ${langName}, 2-3 phrases>",
  "strengths": ["<force 1>", "<force 2>"],
  "weaknesses": ["<faiblesse 1>", "<faiblesse 2>"],
  "recommendations": ["<reco prioritaire 1>", "<reco 2>", "<reco 3>"]
}
Toutes les explications en ${langName}. Sois précis et actionnable.`;
  return geminiJson(prompt, 1400);
}

/* Score d'opportunité d'un mot-clé : combine la vraie concurrence YouTube + estimation IA */
async function keywordOpportunity(query, info = {}, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const sugg = (info.suggestions || []).slice(0, 12).join(', ');
  const prompt = `Tu es un expert SEO YouTube. Évalue l'OPPORTUNITÉ de se positionner sur le mot-clé : "${query}".

Données réelles YouTube observées :
- Concurrence (vues moyennes du top) : ${info.competition || 'inconnue'} (${info.top_avg_views ? '~' + info.top_avg_views + ' vues' : 'n/d'})
- Suggestions/recherches associées : ${sugg || 'aucune'}

En te basant sur ces données ET ta connaissance des tendances, estime la demande de recherche et la tendance.
Plus l'opportunité est élevée = forte demande + concurrence faible (facile à classer).

Réponds UNIQUEMENT en JSON valide :
{
  "score": <0-100, score d'opportunité global>,
  "difficulty": "facile" | "moyen" | "difficile",
  "demand": "faible" | "moyen" | "élevé",
  "trend": "montant" | "stable" | "déclin",
  "verdict": "<recommandation en ${langName}, 1-2 phrases>",
  "best_keywords": [
    {"keyword": "<mot-clé long-tail à fort potentiel, en ${langName}, lié à '${query}'>", "difficulty": "facile" | "moyen" | "difficile", "why": "<pourquoi en ${langName}>"}
  ]
}
Donne 4 à 6 best_keywords, RÉDIGÉS EN ${langName} (pas en français sauf si ${langName} est le français), et privilégie les long-tail faciles à classer. Tout le JSON (y compris "keyword") en ${langName}.`;
  return geminiJson(prompt, 1500);
}

/* Détecteur de tendances : analyse les vidéos qui explosent et en extrait les tendances */
async function detectTrends(videos = [], niche = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const list = (videos || []).slice(0, 12).map((v, i) => `${i + 1}. (${v.views_per_hour}/h) ${v.title}`).join('\n');
  const prompt = `Tu es un analyste de tendances YouTube. Voici les vidéos qui EXPLOSENT en ce moment dans la niche "${niche || 'généraliste'}" (publiées récemment, triées par vues/heure) :
"""
${list}
"""

Analyse-les et extrais les tendances actuelles.
Réponds UNIQUEMENT en JSON valide :
{
  "trends": [
    {"topic": "<sujet/thème qui tend en ${langName}>", "format": "<format qui marche, ex: tutoriel, réaction, vlog>", "why": "<pourquoi ça marche maintenant en ${langName}>"}
  ],
  "rising_keywords": ["<mot-clé en hausse 1>", "<mot-clé 2>", "<mot-clé 3>", "<mot-clé 4>", "<mot-clé 5>"],
  "advice": ["<conseil pour surfer sur ces tendances 1 en ${langName}>", "<conseil 2>", "<conseil 3>"]
}
3 à 5 tendances. Tout en ${langName}.`;
  return geminiJson(prompt, 1800);
}

/* Générateur de script complet à partir d'un sujet */
async function generateScript(topic, niche = '', duration = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const dur = duration ? `Durée cible : ${duration}.` : '';
  const prompt = `Tu es un scénariste YouTube expert en rétention. Écris un SCRIPT complet et structuré pour une vidéo.
Sujet : "${topic}". Niche : "${niche || 'généraliste'}". ${dur}

Réponds UNIQUEMENT en JSON valide :
{
  "hook": "<accroche des 5 premières secondes en ${langName}>",
  "intro": "<intro courte qui pose la promesse en ${langName}>",
  "sections": [
    {"title": "<titre de section>", "content": "<ce qu'il faut dire/montrer, 2-4 phrases en ${langName}>"}
  ],
  "cta": "<appel à l'action (abonnement/commentaire) en ${langName}>",
  "outro": "<conclusion + teaser de la prochaine vidéo en ${langName}>"
}
4 à 6 sections. Concret et actionnable. Tout en ${langName}.`;
  return geminiJson(prompt, 2600);
}

/* Vérif Titre + Miniature : se complètent-ils ? Lisibles TV/mobile ? */
async function pairCheck(title, imageBase64, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  let desc = '';
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    try { desc = await cloudflareDescribeImage(imageBase64); } catch (e) {}
  }
  if (desc) {
    const prompt = `Tu es un expert YouTube CTR. Voici une miniature décrite : "${desc}". Le titre de la vidéo est : "${title}".
Évalue si le TITRE et la MINIATURE se COMPLÈTENT (idéalement la miniature ne répète pas le texte du titre, mais ajoute une info/émotion) et s'ils sont lisibles sur grand écran (TV) ET mobile.
Réponds UNIQUEMENT en JSON valide :
{ "match_score": <0-100>, "complement": <true|false>, "verdict": "<analyse en ${langName}, 2-3 phrases>", "issues": ["<problème 1 en ${langName}>"], "tips": ["<conseil 1 en ${langName}>","<conseil 2>"], "tv_readable": <true|false>, "mobile_readable": <true|false> }`;
    return geminiJson(prompt, 1100);
  }
  // Fallback Gemini Vision
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Analyse indisponible');
  const prompt = `Tu es un expert YouTube CTR. Le titre est : "${title}". Analyse si cette miniature COMPLÈTE le titre (sans répéter le même texte) et sa lisibilité sur TV et mobile, en ${langName}.
Réponds UNIQUEMENT en JSON : { "match_score": <0-100>, "complement": <true|false>, "verdict": "<...>", "issues": ["..."], "tips": ["...","..."], "tv_readable": <true|false>, "mobile_readable": <true|false> }`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }] }], generationConfig: { maxOutputTokens: 1024, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } })
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || `Gemini ${r.status}`); }
  const d = await r.json();
  return parseJson(d.candidates?.[0]?.content?.parts?.[0]?.text || '');
}

/* Optimiseur de playlists : regroupe les vidéos en playlists optimisées */
async function optimizePlaylists(videos = [], language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const list = (videos || []).slice(0, 30).map((v, i) => `${i + 1}. ${v.title}`).join('\n');
  const prompt = `Tu es un stratège YouTube. À partir de ces vidéos d'une chaîne, propose des PLAYLISTS optimisées pour augmenter le temps de session et la satisfaction (regroupe par thème/série logique).

Vidéos :
"""
${list}
"""

Réponds UNIQUEMENT en JSON valide :
{
  "playlists": [
    {"name": "<nom de playlist accrocheur en ${langName}>", "description": "<description SEO courte en ${langName}>", "videos": ["<titre exact d'une vidéo de la liste>", "..."]}
  ]
}
3 à 6 playlists. Utilise les titres EXACTS de la liste. Tout en ${langName}.`;
  return geminiJson(prompt, 2000);
}

/* Planificateur de contenu : planning 7 jours adapté à la niche */
async function generateContentPlan(niche = '', region = '', frequency = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const freq = frequency ? `Rythme souhaité : ${frequency}.` : '';
  const prompt = `Tu es un stratège de contenu YouTube. Crée un PLANNING de 7 jours pour une chaîne.
Niche : "${niche || 'généraliste'}". Audience : "${region || 'mondial'}". ${freq}

Réponds UNIQUEMENT en JSON valide :
{
  "plan": [
    {"day": "<jour 1, ex Lundi>", "type": "Vidéo longue" ou "Short" ou "Repos", "idea": "<idée de contenu en ${langName}>", "time": "<meilleur créneau, ex 19:00>", "why": "<raison courte en ${langName}>"}
  ]
}
7 jours (mix de vidéos longues, Shorts et 1-2 jours de repos selon un rythme réaliste). Tout en ${langName}.`;
  return geminiJson(prompt, 2000);
}

/* Localisation : traduit titre + description + tags vers une langue cible */
async function translateMetadata(title = '', description = '', targetLang = 'en', language = 'fr') {
  const targetName = LANG_NAMES[targetLang] || targetLang;
  const prompt = `Tu es un traducteur YouTube expert en localisation (pas une traduction mot à mot, mais adaptée à la culture et au SEO).
Traduis et ADAPTE ces métadonnées vers ${targetName}.

Titre : "${title}"
Description : "${(description || '').slice(0, 600)}"

Réponds UNIQUEMENT en JSON valide :
{
  "title": "<titre traduit et optimisé en ${targetName}>",
  "description": "<description traduite et adaptée en ${targetName}>",
  "tags": ["<tag SEO 1 en ${targetName}>", "<tag 2>", "<...jusqu'à 10 tags>"]
}`;
  return geminiJson(prompt, 1500);
}

/* Posts communautaires : sondages, questions, teasers pour l'onglet Communauté */
async function generateCommunityPosts(niche = '', topic = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [niche && `Niche : ${niche}`, topic && `Sujet : ${topic}`].filter(Boolean).join('. ');
  const prompt = `Tu es un expert de l'engagement YouTube. Génère 5 posts pour l'onglet Communauté afin de garder l'audience active entre deux vidéos.
${ctx || 'Niche généraliste.'}

Réponds UNIQUEMENT en JSON valide :
{
  "posts": [
    {"type": "<'Sondage', 'Question', 'Teaser' ou 'Annonce', traduit en ${langName}>", "text": "<texte du post en ${langName}>", "options": ["<option sondage 1>", "<option 2>"]}
  ]
}
5 posts variés (au moins 2 sondages avec options). Tout en ${langName}, y compris le champ "type". Pour les non-sondages, "options" = [].`;
  return geminiJson(prompt, 1600);
}

/* Générateur d'idées de vidéos à fort potentiel selon niche/région/sujet */
async function generateVideoIdeas(niche = '', region = '', topic = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [niche && `Niche : ${niche}`, region && `Audience : ${region}`, topic && `Sujet/mot-clé : ${topic}`].filter(Boolean).join('. ');
  const prompt = `Tu es un stratège de contenu YouTube. Génère 10 idées de vidéos à FORT potentiel viral.
${ctx || 'Niche généraliste, audience mondiale.'}

Chaque idée doit avoir un titre accrocheur, un angle original, et une raison pour laquelle ça marche.

Réponds UNIQUEMENT en JSON valide :
{
  "ideas": [
    {
      "title": "<titre de vidéo accrocheur en ${langName}, prêt à l'emploi>",
      "angle": "<angle/concept original en ${langName}>",
      "why": "<pourquoi ça peut marcher en ${langName}, 1 phrase>",
      "format": "Long" ou "Short",
      "viral_score": <0-100>
    }
  ]
}
10 idées variées (tutoriels, listicles, défis, réactions, histoires…) adaptées à la niche et à l'audience. Tout en ${langName}.`;
  return geminiJson(prompt, 2200);
}

/* Kit sponsor & monétisation : tarif sponso + pitch + media-kit + idées d'affiliation */
async function sponsorKit(niche = '', region = '', subscribers = 0, avgViews = 0, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const subs = parseInt(subscribers, 10) || 0;
  const views = parseInt(avgViews, 10) || 0;
  const prompt = `Tu es un expert de la monétisation des créateurs YouTube (sponsoring, affiliation).
Chaîne — Niche : "${niche || 'généraliste'}". Audience : "${region || 'mondial'}". Abonnés : ${subs}. Vues moyennes/vidéo : ${views}.

Le tarif d'un placement sponsorisé dépend ÉNORMÉMENT de la niche (finance/tech/business = élevé ; divertissement/vlog = faible) ET du pays de l'audience (USA/Europe/Golfe = élevé ; Maghreb/Inde/Afrique = beaucoup plus faible). Base-toi sur les vues moyennes.

Réponds UNIQUEMENT en JSON valide :
{
  "rate_usd": { "low": <nombre>, "high": <nombre> },
  "rate_basis": "<explication courte du calcul en ${langName}>",
  "pitch": "<message de prospection prêt à envoyer à une marque, chaleureux et pro, en ${langName}, avec un espace [Marque]>",
  "media_kit": ["<argument clé 1 (audience, niche, engagement…) en ${langName}>", "<argument 2>", "<argument 3>", "<argument 4>"],
  "brand_types": ["<type de marque qui irait bien 1>", "<type 2>", "<type 3>"],
  "affiliate_ideas": ["<idée de produit/programme d'affiliation adapté 1>", "<idée 2>", "<idée 3>"]
}
Sois réaliste sur les tarifs. Tout en ${langName}.`;
  return geminiJson(prompt, 1600);
}

/* Estimateur de vues (J+7) et de revenus AdSense selon titre/niche/région/abonnés */
async function estimateRevenue(title, niche = '', region = '', subscribers = 0, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const subs = parseInt(subscribers, 10) || 0;
  const prompt = `Tu es un analyste YouTube spécialisé dans la monétisation. Estime de façon RÉALISTE les performances d'une vidéo.
Titre : "${title}".
Niche : "${niche || 'généraliste'}".
Audience cible : "${region || 'mondial'}".
Abonnés de la chaîne : ${subs}.

Tiens compte de :
- Le RPM/CPM varie ÉNORMÉMENT selon la niche (finance/business/tech = élevé 5-25$ ; divertissement/vlog/gaming = faible 1-4$) ET selon le pays de l'audience (USA/Europe/Golfe = élevé ; Maghreb/Inde/Afrique = beaucoup plus faible).
- Les vues à J+7 dépendent surtout du nombre d'abonnés et de l'attrait du titre.

Réponds UNIQUEMENT en JSON valide :
{
  "views_7d": { "low": <entier>, "expected": <entier>, "high": <entier> },
  "rpm_usd": <revenu estimé pour 1000 vues monétisées, en USD>,
  "revenue_usd": { "low": <nombre>, "expected": <nombre>, "high": <nombre> },
  "factors": ["<facteur clé 1 en ${langName}>", "<facteur 2>", "<facteur 3>"],
  "tips": ["<conseil pour augmenter vues/revenus 1 en ${langName}>", "<conseil 2>", "<conseil 3>"]
}
Sois réaliste (pas trop optimiste). Explications en ${langName}.`;
  return geminiJson(prompt, 1400);
}

/* Pack vidéo complet : description (+ abonne-toi) + hashtags + tags, selon titre/niche/région */
async function generateVideoPackage(title, niche = '', region = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [niche && `Niche : ${niche}`, region && `Audience cible : ${region}`].filter(Boolean).join('. ');
  const prompt = `Tu es un expert YouTube SEO et copywriter. Rédige le pack COMPLET pour cette vidéo, en ${langName}.
Titre : "${title}".${ctx ? ' ' + ctx + '.' : ''}

Réponds UNIQUEMENT en JSON valide :
{
  "description": "<description engageante de 4 à 6 lignes, riche en mots-clés, adaptée à la niche et à l'audience, en ${langName}>",
  "subscribe_cta": "<une phrase d'appel à l'abonnement accrocheuse, en ${langName}>",
  "hashtags": ["#mot1","#mot2","#mot3","#mot4","#mot5"],
  "tags": ["<tag SEO 1>","<tag 2>","<tag 3>","<...jusqu'à 15 tags pertinents>"]
}`;
  return geminiJson(prompt, 1500);
}

/* Optimiseur d'audience : cible (mondial/région/pays) + langue → heures, tendances, hashtags, sujets */
async function optimizeAudience(target, contentLang = 'fr', uiLang = 'fr', niche = '') {
  const contentName = LANG_NAMES[contentLang] || contentLang;
  const uiName = LANG_NAMES[uiLang] || uiLang;
  const targetClean = (target && target.trim()) ? target.trim() : 'Mondial / International';
  const nicheLine = (niche && niche.trim())
    ? `Niche / style de la chaîne : "${niche.trim()}". Adapte TOUTES les recommandations (heures, tendances, hashtags, sujets) à cette niche précise.`
    : `Niche non précisée : donne des recommandations générales.`;
  const prompt = `Tu es un stratège de croissance YouTube spécialisé dans le ciblage d'audience par région.
Cible : "${targetClean}". Langue du contenu/de l'audience : ${contentName}.
${nicheLine}

Donne des recommandations concrètes pour percer auprès de cette audience :
- Les meilleures heures et jours de publication (tiens compte du fuseau horaire et des habitudes de visionnage de "${targetClean}").
- Les tendances et formats qui marchent dans ce marché.
- Des hashtags localisés (EN ${contentName}).
- Des idées de sujets de vidéos adaptés à ce public (EN ${contentName}).
- Des conseils culturels/format spécifiques.

Réponds UNIQUEMENT en JSON valide :
{
  "target": "${targetClean}",
  "timezone": "<fuseau horaire principal de la cible>",
  "best_times": [
    {"day": "<jour>", "time": "<heure locale, ex 20:00>", "reason": "<pourquoi, en ${uiName}>"}
  ],
  "trends": ["<tendance/format 1 en ${uiName}>", "<tendance 2>", "<tendance 3>"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "topic_ideas": ["<idée de vidéo 1 en ${contentName}>", "<idée 2>", "<idée 3>", "<idée 4>"],
  "tips": ["<conseil culturel/format 1 en ${uiName}>", "<conseil 2>", "<conseil 3>"]
}
Donne 3-4 créneaux horaires. Les hashtags et idées de sujets en ${contentName} ; les explications (reason, trends, tips) en ${uiName}.`;
  return geminiJson(prompt, 1800);
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
  return geminiJson(prompt, 2048);
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
  imageBase64 = stripDataUri(imageBase64);

  // 1) Cloudflare : LLAVA décrit l'image, puis Llama produit le JSON (gratuit, sans quota Gemini)
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) {
    try {
      const desc = await cloudflareDescribeImage(imageBase64);
      if (desc) {
        const prompt = `IMPORTANT : réponds ENTIÈREMENT en ${langName} (tous les champs texte, y compris "strengths", "tips" et "emotion").
Tu es un expert des miniatures YouTube (CTR). Voici la description d'une miniature (titre de la vidéo : "${title}") : "${desc}".
Réponds UNIQUEMENT en JSON valide :
{ "score": <0-100>, "strengths": ["<point fort 1 en ${langName}>","<point fort 2 en ${langName}>"], "tips": ["<conseil CTR 1 en ${langName}>","<conseil 2 en ${langName}>","<conseil 3 en ${langName}>"], "has_text": <true|false>, "has_face": <true|false>, "emotion": "<émotion en ${langName}, ou 'neutre'>" }`;
        return await geminiJson(prompt, 900);
      }
    } catch (e) { /* on bascule sur Gemini Vision */ }
  }

  // 2) Fallback : Gemini Vision
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Analyse de miniature indisponible');
  const prompt = `IMPORTANT : réponds ENTIÈREMENT en ${langName} (tous les champs texte, y compris "strengths", "tips" et "emotion").
Tu es un expert des miniatures YouTube (CTR). Analyse cette miniature (titre : "${title}").
Réponds UNIQUEMENT en JSON : { "score": <0-100>, "strengths": ["<en ${langName}>"], "tips": ["<en ${langName}>","<en ${langName}>","<en ${langName}>"], "has_text": <true|false>, "has_face": <true|false>, "emotion": "<en ${langName}>" }`;
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

/* Génère 3 CONCEPTS de miniature (brief texte structuré, pas une image) */
async function thumbnailIdeas(title, niche = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const nicheLine = niche ? `Niche/thématique : ${niche}.` : '';
  const prompt = `Tu es directeur artistique de miniatures YouTube à très fort taux de clic (CTR).
Pour une vidéo intitulée : "${title}". ${nicheLine}
Génère 3 CONCEPTS de miniature DISTINCTS, chacun ciblant une émotion différente (ex : curiosité, choc, désir).
Chaque concept est un BRIEF actionnable qu'un créateur peut exécuter (Canva, Photoshop, designer), PAS une image.

Réponds UNIQUEMENT en JSON valide :
{
  "concepts": [
    {
      "emotion": "<émotion ciblée>",
      "text": "<texte à mettre sur la miniature, 2 à 4 mots MAX, percutant>",
      "palette": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
      "focal_point": "<élément visuel central, ex : visage choqué à droite>",
      "face": { "expression": "<expression du visage>", "placement": "<gauche|droite|centre>" },
      "style": "<style visuel, ex : contraste élevé, flèche rouge, gros plan>",
      "background": "<idée de fond>",
      "image_prompt": "<prompt EN ANGLAIS pour générer le fond via une IA d'image, 16:9>",
      "justification": "<pourquoi ce concept maximise le CTR, 1 phrase>"
    }
  ]
}
Le texte de la miniature doit rester lisible sur mobile en petit. 3 concepts variés et concrets. Tout (sauf les codes couleur et image_prompt) en ${langName}. Sois CONCIS pour garder un JSON complet et valide.`;
  return geminiJson(prompt, 1600);
}

/* Hashtags YouTube classés (larges / niche / tendance) */
async function generateHashtags(title, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Génère des hashtags YouTube optimisés pour la vidéo "${title}" en ${langName}.
Réponds UNIQUEMENT en JSON valide :
{
  "broad": ["#hashtag", "..."],
  "niche": ["#hashtag", "..."],
  "trending": ["#hashtag", "..."]
}
5 hashtags par catégorie. "broad" = larges/populaires, "niche" = spécifiques au sujet, "trending" = tendance actuelle. Chaque hashtag commence par #, sans espace.`;
  return geminiJson(prompt, 700);
}

/* Meilleurs créneaux de publication (heuristique IA selon niche/audience) */
async function bestPublishTime(niche = '', region = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un analyste d'audience YouTube. Pour une chaîne dans la niche "${niche || 'généraliste'}" visant "${region || 'audience mondiale'}", recommande les meilleurs moments de publication.
Réponds UNIQUEMENT en JSON valide :
{
  "summary": "<conseil global en ${langName}, 1-2 phrases>",
  "slots": [
    {"day": "<jour>", "time": "<heure locale, ex 19:00>", "why": "<raison courte en ${langName}>"}
  ]
}
4 à 5 créneaux (meilleurs jours/heures, du plus au moins fort). Tout en ${langName}.`;
  return geminiJson(prompt, 1000);
}

/* ════════════════════════════════════════════════════════════════
   SEO TikTok — suite complète (légende, hooks, hashtags, script,
   mots-clés, sons, conseils). 100% IA, sans API TikTok.
   ════════════════════════════════════════════════════════════════ */
async function generateTikTokSEO(topic, niche = '', description = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [
    niche && `Niche/style : ${niche}`,
    description && `Contexte de la vidéo : ${description}`
  ].filter(Boolean).join('. ');
  const prompt = `Tu es un expert SEO TikTok et créateur viral. Optimise à fond la découvrabilité d'une vidéo TikTok.
Sujet : "${topic}".${ctx ? ' ' + ctx + '.' : ''}
Adapte-toi au format TikTok : vidéos courtes verticales, rythme rapide, les 3 premières secondes sont décisives.

IMPORTANT : quelle que soit la langue du sujet ci-dessus, ta réponse doit être ENTIÈREMENT rédigée en ${langName} (sauf les hashtags, qui peuvent rester tels quels). Ne mélange jamais les langues.

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{
  "caption": "<légende TikTok optimisée : accroche + mots-clés naturels + appel à l'action, 1 à 3 phrases, avec 2-3 emojis pertinents>",
  "hooks": ["<accroche des 3 premières secondes, très percutante>", "<hook 2>", "<hook 3>", "<hook 4>", "<hook 5>"],
  "hashtags": {
    "broad": ["#...", "#...", "#...", "#...", "#..."],
    "niche": ["#...", "#...", "#...", "#...", "#..."],
    "trending": ["#...", "#...", "#...", "#...", "#..."]
  },
  "keywords": ["<mot-clé que les gens tapent dans la recherche TikTok>", "<...6 à 8 mots-clés>"],
  "script": [
    {"part": "Hook (0-3s)", "content": "<ce qui doit être dit/montré>"},
    {"part": "Corps", "content": "<développement rythmé>"},
    {"part": "Chute / CTA", "content": "<fin + appel à suivre/commenter>"}
  ],
  "sound_advice": "<quel type de son/musique tendance utiliser pour ce sujet et pourquoi>",
  "posting_tips": ["<conseil de publication : durée idéale, format, moment>", "<...3 à 4 conseils>"],
  "discoverability_tips": ["<astuce concrète pour être mieux référencé sur TikTok>", "<...3 à 4 astuces>"]
}
Contraintes : 5 hooks VARIÉS, 5 hashtags par catégorie (broad = larges/populaires, niche = spécifiques au sujet, trending = tendance générique), 6-8 mots-clés, 3-4 éléments par liste de conseils. Chaque hashtag commence par # sans espace. Reste CONCIS pour garantir un JSON complet et valide.`;
  return geminiJson(prompt, 2000);
}

/* ── TikTok : transformer une vidéo YouTube longue en 3 scripts TikTok courts ── */
async function tiktokRepurpose(title = '', description = '', transcript = '', niche = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const src = [
    title && `Titre : ${title}`,
    niche && `Niche : ${niche}`,
    description && `Description : ${description.slice(0, 400)}`,
    transcript && `Transcription (extrait) : ${transcript.slice(0, 1500)}`
  ].filter(Boolean).join('\n');
  const prompt = `Tu es expert du repurposing de contenu. Transforme cette vidéo YouTube longue en 3 vidéos TikTok courtes et percutantes (verticales, 15-45s).
${src}

IMPORTANT : la transcription/description ci-dessus peut être dans une AUTRE langue que celle demandée. Ignore la langue de la source : ta réponse (angle, hook, script, caption) doit être ENTIÈREMENT écrite en ${langName}, jamais dans la langue de la transcription. Réponds UNIQUEMENT en JSON valide :
{
  "clips": [
    {
      "angle": "<le moment fort/angle à extraire>",
      "hook": "<accroche des 3 premières secondes>",
      "script": "<mini-script parlé de 15-45s>",
      "caption": "<légende TikTok optimisée avec emojis>",
      "hashtags": ["#...", "#...", "#...", "#...", "#..."]
    }
  ]
}
Exactement 3 clips VARIÉS. Reste concis pour garantir un JSON valide.`;
  return geminiJson(prompt, 2000);
}

/* ── TikTok : 10 idées de vidéos virales par niche ── */
async function tiktokViralIdeas(niche = '', topic = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [niche && `Niche : ${niche}`, topic && `Sujet/angle : ${topic}`].filter(Boolean).join('. ');
  const prompt = `Tu es stratège TikTok viral. Propose 10 idées de vidéos TikTok à fort potentiel.${ctx ? ' ' + ctx + '.' : ''}
Varie les formats (POV, tuto, storytime, challenge, avant/après, listicle, réaction, coulisses…).
IMPORTANT : réponds ENTIÈREMENT en ${langName}, quelle que soit la langue du sujet fourni.
Réponds UNIQUEMENT en JSON valide :
{
  "ideas": [
    {"title": "<idée accrocheuse>", "format": "<format>", "hook": "<accroche 3s>", "why": "<pourquoi ça peut percer>", "viral_score": <0-100>}
  ]
}
Exactement 10 idées. Reste concis.`;
  return geminiJson(prompt, 2000);
}

/* ── TikTok : optimiseur de hooks (8 variantes notées) ── */
async function tiktokHooks(topic = '', niche = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = niche ? ` Niche : ${niche}.` : '';
  const prompt = `Tu es expert en rétention TikTok (les 3 premières secondes décident de tout). Pour une vidéo sur : "${topic}".${ctx}
Génère 8 accroches VARIÉES (question, choc, promesse, curiosité, statistique, controverse, storytime, négatif). Note chacune sur 100 selon son pouvoir d'arrêt du scroll.
IMPORTANT : réponds ENTIÈREMENT en ${langName}, quelle que soit la langue du sujet fourni.
Réponds UNIQUEMENT en JSON valide :
{
  "hooks": [{"text": "<accroche>", "type": "<type>", "score": <0-100>}],
  "best_index": <index 0-based du meilleur>,
  "tip": "<1 conseil pour renforcer un hook>"
}
Exactement 8 hooks. Reste concis.`;
  return geminiJson(prompt, 1400);
}

/* ── TikTok : calendrier de contenu sur 7 jours ── */
async function tiktokCalendar(niche = '', frequency = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const freq = frequency || '1 vidéo/jour';
  const prompt = `Tu es coach de croissance TikTok. Établis un calendrier de contenu sur 7 jours pour la niche "${niche || 'généraliste'}", rythme : ${freq}.
IMPORTANT : réponds ENTIÈREMENT en ${langName}, quelle que soit la langue de la niche fournie.
Réponds UNIQUEMENT en JSON valide :
{
  "schedule": [
    {"day": "<Jour 1>", "idea": "<idée de vidéo précise>", "format": "<format>", "hook": "<accroche courte>", "best_time": "<meilleur créneau>"}
  ]
}
Exactement 7 jours, variés (éducatif/divertissant/engageant). Reste concis.`;
  return geminiJson(prompt, 1800);
}

/* ── TikTok : découpage HORODATÉ d'une vidéo YouTube (à partir de sa transcription) ── */
async function tiktokRepurposeTimed(title = '', duration = '', timedTranscript = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es monteur expert de contenu viral. On te donne la TRANSCRIPTION HORODATÉE d'une vidéo YouTube. Identifie les 3 à 5 MEILLEURS moments à découper en clips TikTok verticaux (15-60s), en donnant les TIMECODES exacts (début → fin) tirés des horodatages fournis.
Titre : "${title}".${duration ? ' Durée : ' + duration + '.' : ''}

Transcription horodatée :
${timedTranscript}

IMPORTANT : la transcription ci-dessus est probablement dans une AUTRE langue que celle demandée. Ignore complètement sa langue : ta réponse (angle, hook, caption) doit être ENTIÈREMENT rédigée en ${langName}, jamais dans la langue de la transcription. Ne recopie ni ne traduis mot à mot la transcription — reformule dans le style TikTok, en ${langName}.
Réponds UNIQUEMENT en JSON valide :
{
  "clips": [
    {
      "start": "<timecode de début, ex 1:26>",
      "end": "<timecode de fin, ex 1:50>",
      "angle": "<pourquoi ce moment est fort/viral>",
      "hook": "<accroche des 3 premières secondes>",
      "caption": "<légende TikTok optimisée avec emojis>",
      "hashtags": ["#...", "#...", "#...", "#...", "#..."]
    }
  ]
}
3 à 5 clips. Les timecodes DOIVENT correspondre à des moments réels présents dans la transcription (utilise les [m:ss] fournis). Reste concis pour garantir un JSON valide.`;
  return geminiJson(prompt, 2200);
}

/* ════════════════════════════════════════════════════════════════
   SEO Instagram — suite complète (légende, hooks, hashtags, script,
   mots-clés, audio, conseils). 100% IA, sans API Instagram.
   Même architecture que la suite TikTok ci-dessus, adaptée au format
   Instagram : Reels + carrousels + Stories (pas qu'un seul format
   vidéo), et une stratégie hashtags propre à Instagram (jusqu'à 30
   hashtags tolérés, pratique courante de les cacher en 1er commentaire).
   ════════════════════════════════════════════════════════════════ */
async function generateInstagramSEO(topic, niche = '', description = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [
    niche && `Niche/style : ${niche}`,
    description && `Contexte de la publication : ${description}`
  ].filter(Boolean).join('. ');
  const prompt = `Tu es un expert SEO Instagram et créateur de contenu viral. Optimise à fond la découvrabilité d'une publication Instagram (Reel).
Sujet : "${topic}".${ctx ? ' ' + ctx + '.' : ''}
Adapte-toi aux codes Instagram : Reels verticaux courts, algorithme qui favorise la rétention ET les partages/enregistrements, hashtags souvent placés en fin de légende ou en 1er commentaire.

IMPORTANT : quelle que soit la langue du sujet ci-dessus, ta réponse doit être ENTIÈREMENT rédigée en ${langName} (sauf les hashtags, qui peuvent rester tels quels). Ne mélange jamais les langues.

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{
  "caption": "<légende Instagram optimisée : accroche + valeur + appel à l'action (like/enregistrer/partager), 2 à 4 phrases, avec 2-3 emojis pertinents>",
  "hooks": ["<accroche des 3 premières secondes du Reel ou 1re ligne de légende, très percutante>", "<hook 2>", "<hook 3>", "<hook 4>", "<hook 5>"],
  "hashtags": {
    "broad": ["#...", "#...", "#...", "#...", "#..."],
    "niche": ["#...", "#...", "#...", "#...", "#..."],
    "trending": ["#...", "#...", "#...", "#...", "#..."]
  },
  "keywords": ["<mot-clé que les gens tapent dans la recherche/l'Explorer Instagram>", "<...6 à 8 mots-clés>"],
  "script": [
    {"part": "Hook (0-3s)", "content": "<ce qui doit être dit/montré>"},
    {"part": "Corps", "content": "<développement rythmé>"},
    {"part": "Chute / CTA", "content": "<fin + appel à enregistrer/partager/commenter>"}
  ],
  "sound_advice": "<quel type d'audio/musique tendance Reels utiliser pour ce sujet et pourquoi>",
  "posting_tips": ["<conseil de publication : durée idéale, format (Reel/carrousel/photo), moment>", "<...3 à 4 conseils>"],
  "discoverability_tips": ["<astuce concrète pour être mieux référencé dans l'Explorer/la recherche Instagram>", "<...3 à 4 astuces>"]
}
Contraintes : 5 hooks VARIÉS, 5 hashtags par catégorie (broad = larges/populaires, niche = spécifiques au sujet, trending = tendance générique), 6-8 mots-clés, 3-4 éléments par liste de conseils. Chaque hashtag commence par # sans espace. Reste CONCIS pour garantir un JSON complet et valide.`;
  return geminiJson(prompt, 2000);
}

/* ── Instagram : 10 idées de Reels/publications virales par niche ── */
async function instagramViralIdeas(niche = '', topic = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = [niche && `Niche : ${niche}`, topic && `Sujet/angle : ${topic}`].filter(Boolean).join('. ');
  const prompt = `Tu es stratège Instagram/Reels. Propose 10 idées de publications Instagram à fort potentiel.${ctx ? ' ' + ctx + '.' : ''}
Varie les formats (Reel POV, tuto, storytime, avant/après, carrousel listicle, réaction, coulisses, Reel esthétique/mood…) et précise le format (Reel/Carrousel/Photo/Story).
IMPORTANT : réponds ENTIÈREMENT en ${langName}, quelle que soit la langue du sujet fourni.
Réponds UNIQUEMENT en JSON valide :
{
  "ideas": [
    {"title": "<idée accrocheuse>", "format": "<Reel|Carrousel|Photo|Story>", "hook": "<accroche 3s ou 1re slide>", "why": "<pourquoi ça peut percer>", "viral_score": <0-100>}
  ]
}
Exactement 10 idées. Reste concis.`;
  return geminiJson(prompt, 2000);
}

/* ── Instagram : optimiseur de hooks (8 variantes notées) ── */
async function instagramHooks(topic = '', niche = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctx = niche ? ` Niche : ${niche}.` : '';
  const prompt = `Tu es expert en rétention Instagram/Reels (les 3 premières secondes — ou la 1re slide d'un carrousel — décident de tout). Pour une publication sur : "${topic}".${ctx}
Génère 8 accroches VARIÉES (question, choc, promesse, curiosité, statistique, controverse, storytime, négatif). Note chacune sur 100 selon son pouvoir d'arrêt du scroll.
IMPORTANT : réponds ENTIÈREMENT en ${langName}, quelle que soit la langue du sujet fourni.
Réponds UNIQUEMENT en JSON valide :
{
  "hooks": [{"text": "<accroche>", "type": "<type>", "score": <0-100>}],
  "best_index": <index 0-based du meilleur>,
  "tip": "<1 conseil pour renforcer un hook>"
}
Exactement 8 hooks. Reste concis.`;
  return geminiJson(prompt, 1400);
}

/* ── Instagram : calendrier de contenu sur 7 jours (mix Reel/carrousel/photo/story) ── */
async function instagramCalendar(niche = '', frequency = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const freq = frequency || '1 publication/jour';
  const prompt = `Tu es coach de croissance Instagram. Établis un calendrier de contenu sur 7 jours pour la niche "${niche || 'généraliste'}", rythme : ${freq}.
Varie les FORMATS entre Reel, Carrousel, Photo et Story selon ce qui convient le mieux à chaque idée.
IMPORTANT : réponds ENTIÈREMENT en ${langName}, quelle que soit la langue de la niche fournie.
Réponds UNIQUEMENT en JSON valide :
{
  "schedule": [
    {"day": "<Jour 1>", "idea": "<idée de publication précise>", "format": "<Reel|Carrousel|Photo|Story>", "hook": "<accroche courte>", "best_time": "<meilleur créneau>"}
  ]
}
Exactement 7 jours, variés (éducatif/divertissant/engageant). Reste concis.`;
  return geminiJson(prompt, 1800);
}

/* ── Instagram : découpage HORODATÉ d'une vidéo YouTube en Reels (à partir de sa transcription) ── */
async function instagramRepurposeTimed(title = '', duration = '', timedTranscript = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es monteur expert de contenu viral. On te donne la TRANSCRIPTION HORODATÉE d'une vidéo YouTube. Identifie les 3 à 5 MEILLEURS moments à découper en Reels Instagram verticaux (15-90s), en donnant les TIMECODES exacts (début → fin) tirés des horodatages fournis.
Titre : "${title}".${duration ? ' Durée : ' + duration + '.' : ''}

Transcription horodatée :
${timedTranscript}

IMPORTANT : la transcription ci-dessus est probablement dans une AUTRE langue que celle demandée. Ignore complètement sa langue : ta réponse (angle, hook, caption) doit être ENTIÈREMENT rédigée en ${langName}, jamais dans la langue de la transcription. Ne recopie ni ne traduis mot à mot la transcription — reformule dans le style Instagram/Reels, en ${langName}.
Réponds UNIQUEMENT en JSON valide :
{
  "clips": [
    {
      "start": "<timecode de début, ex 1:26>",
      "end": "<timecode de fin, ex 1:50>",
      "angle": "<pourquoi ce moment est fort/viral>",
      "hook": "<accroche des 3 premières secondes>",
      "caption": "<légende Instagram optimisée avec emojis>",
      "hashtags": ["#...", "#...", "#...", "#...", "#..."]
    }
  ]
}
3 à 5 clips. Les timecodes DOIVENT correspondre à des moments réels présents dans la transcription (utilise les [m:ss] fournis). Reste concis pour garantir un JSON valide.`;
  return geminiJson(prompt, 2200);
}

/* ── Instagram : repli SANS transcription (titre + description seulement) ──
   YouTube bloque désormais la récupération des sous-titres depuis un serveur
   (jeton anti-bot généré uniquement par un vrai navigateur, voir getTranscript
   dans youtube.js) — /instagram-repurpose ne peut donc pas toujours produire de
   clips horodatés. Plutôt qu'un échec sec, ce repli génère 3 idées de Reels à
   partir du titre/de la description seuls (mêmes clips angle/hook/caption/
   hashtags que instagramRepurposeTimed, mais sans "start"/"end" puisqu'aucun
   moment précis n'est identifiable sans le contenu réel de la vidéo). */
async function instagramRepurpose(title = '', description = '', transcript = '', niche = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const src = [
    title && `Titre : ${title}`,
    niche && `Niche : ${niche}`,
    description && `Description : ${description.slice(0, 400)}`,
    transcript && `Transcription (extrait) : ${transcript.slice(0, 1500)}`
  ].filter(Boolean).join('\n');
  const prompt = `Tu es expert du repurposing de contenu. Transforme cette vidéo YouTube longue en 3 Reels Instagram courts et percutants (verticaux, 15-90s).
${src}

IMPORTANT : la description ci-dessus peut être dans une AUTRE langue que celle demandée. Ignore sa langue : ta réponse (angle, hook, script, caption) doit être ENTIÈREMENT écrite en ${langName}, jamais dans la langue de la source. Réponds UNIQUEMENT en JSON valide :
{
  "clips": [
    {
      "angle": "<le moment fort/angle à extraire>",
      "hook": "<accroche des 3 premières secondes>",
      "script": "<mini-script parlé de 15-90s>",
      "caption": "<légende Instagram optimisée avec emojis>",
      "hashtags": ["#...", "#...", "#...", "#...", "#..."]
    }
  ]
}
Exactement 3 clips VARIÉS. Reste concis pour garantir un JSON valide.`;
  return geminiJson(prompt, 2000);
}

/* ════════════════════════════════════════════════════════════════
   Assistant IA public — widget de chat sur le site (visiteurs non
   connectés, voir POST /api/public/ai/chat et js/support-chat.js).
   Contexte produit injecté dans le prompt pour éviter les hallucinations
   sur les tarifs/fonctionnalités. Sortie JSON {reply} comme le reste de
   ce fichier (callGemini/callCloudflareText imposent le mode JSON — pas
   de vrai "mode texte libre" possible sans changer ces deux fonctions).
   ════════════════════════════════════════════════════════════════ */
const VIDSPARK_CONTEXT = `VidSpark AI (vidsparkpro.com) est une plateforme SaaS qui aide les créateurs YouTube (et TikTok/Instagram) à obtenir plus de vues grâce à l'IA : analyse de vidéos (score SEO, score viral), génération de titres/descriptions/tags/miniatures par IA, Coach IA qui donne des actions prioritaires, extension Chrome qui analyse n'importe quelle vidéo YouTube ou TikTok en un clic, suites complètes "SEO TikTok" et "SEO Instagram" (légendes, hooks, hashtags, idées, calendrier, repurposing YouTube → clips courts).
Forfaits : Free (gratuit, 10 analyses/jour), Pro (9,99$/mois), Business (29,99$/mois, jusqu'à 5 chaînes), Diamant (49,99$/mois, jusqu'à 10 chaînes + outils exclusifs : audit de chaîne avancé, suivi de position).`;

async function supportChat(message, history = [], language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const hist = (history || []).slice(-6)
    .map(h => `${h.role === 'assistant' ? 'Assistant' : 'Visiteur'} : ${String(h.content || '').slice(0, 500)}`)
    .join('\n');
  const prompt = `Tu es l'assistant IA de VidSpark AI, présent en chat sur le site public pour aider les visiteurs.
Contexte produit (utilise-le pour répondre avec précision, ne l'invente jamais) :
${VIDSPARK_CONTEXT}
${hist ? '\nHistorique récent de la conversation :\n' + hist + '\n' : ''}
Nouveau message du visiteur : "${message}"

Réponds de façon utile, chaleureuse et concise (2-4 phrases max, sauf si une liste est vraiment utile), ENTIÈREMENT en ${langName}, quelle que soit la langue du message du visiteur. Si la question sort du cadre de VidSpark AI (support technique précis de compte/facturation, sujet hors-sujet), oriente poliment vers la page Contact plutôt que d'inventer une réponse.
Réponds UNIQUEMENT en JSON valide :
{"reply": "<ta réponse>"}`;
  return geminiJson(prompt, 500);
}

/* ════════════════════════════════════════════════════════════════
   Coach IA conversationnel — chat authentifié du tableau de bord (voir
   POST /api/user/coach-chat et le panneau #aiPop dans dashboard.html).
   Contrairement à supportChat (visiteurs anonymes, contexte produit
   générique), ce coach reçoit les VRAIES données de CET utilisateur
   (chaîne, abonnés, scores SEO/viral moyens) pour des réponses
   personnalisées — jamais inventées si une donnée manque.
   ════════════════════════════════════════════════════════════════ */
async function coachChat(message, history = [], context = {}, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const ctxLines = [
    context.channel_name && `Chaîne : ${context.channel_name}`,
    context.subscriber_count != null && `Abonnés : ${context.subscriber_count}`,
    context.videos_analyzed != null && `Vidéos analysées sur VidSpark AI : ${context.videos_analyzed}`,
    context.avg_seo != null && `Score SEO moyen : ${context.avg_seo}/100`,
    context.avg_viral != null && `Score viral moyen : ${context.avg_viral}/100`,
    context.recent_titles && context.recent_titles.length && `Titres récemment analysés : ${context.recent_titles.join(' | ')}`,
    context.plan && `Forfait : ${context.plan}`
  ].filter(Boolean).join('\n');
  const hist = (history || []).slice(-8)
    .map(h => `${h.role === 'assistant' ? 'Coach' : 'Utilisateur'} : ${String(h.content || '').slice(0, 500)}`)
    .join('\n');
  const prompt = `Tu es le Coach IA personnel de VidSpark AI. Tu aides CET utilisateur précis à faire grandir sa chaîne YouTube, en te basant sur ses vraies données ci-dessous — ne les invente JAMAIS, et si une donnée manque dis simplement que tu n'as pas encore assez d'analyses pour ça plutôt que d'inventer un chiffre.
Données réelles de l'utilisateur :
${ctxLines || "Aucune vidéo analysée pour l'instant sur VidSpark AI — c'est un nouvel utilisateur."}
${hist ? '\nConversation récente :\n' + hist + '\n' : ''}
Nouveau message de l'utilisateur : "${message}"

Réponds de façon utile, chaleureuse et actionnable (conseils concrets liés à SES données réelles), en 2-5 phrases sauf si une liste est vraiment utile, ENTIÈREMENT en ${langName}.
Réponds UNIQUEMENT en JSON valide :
{"reply": "<ta réponse>"}`;
  return geminiJson(prompt, 600);
}

/* ════════════════════════════════════════════════════════════════
   Générateur d'histoires cinématographiques (voir story-generator.html
   + routes/story.js). Reprend fidèlement le prompt système d'un build
   externe fourni par l'utilisateur (Google AI Studio, app "ToonStory
   Director AI") : découpe une histoire en scènes ultra-détaillées
   (prompts image/vidéo, continuité, personnages) prêtes pour des
   générateurs d'images/vidéo IA tiers (Nano Banana Pro, LTX-2, etc.).
   Seule adaptation par rapport à l'original : la langue de sortie est
   généralisée aux 14 langues du site via LANG_NAMES (l'original ne
   gérait que en/ar/fr en dur) — le contenu du prompt système lui-même
   n'a pas été réécrit. ════════════════════════════════════════════ */
const STORY_SYSTEM_INSTRUCTION = `
You are an expert animation director and AI prompt engineer.
Your task is to transform story inputs into professional production-ready scene breakdowns for AI image/video generation.

RULES:
- Divide the story into an optimal number of scenes. If the user requested a specific number of scenes (e.g. 5 scenes), but the narrative, pacing, transitions, or emotional beats require more scenes for smooth and rich storytelling, you MUST automatically add extra scenes dynamically (e.g., generating 7, 8, 10 or more scenes as needed). Never truncate the story to rigidly fit the requested scene count; prioritize high-end cinema pacing.
- Technical AI Prompts (prompt, videoPrompt, sequentialVideoPrompt, character prompts) MUST remain in English.
- User-facing fields must match the requested language.

UNLIMITED CHARACTERS RULE:
- You must identify and map all characters in the story, ranging from the protagonist to secondary roles, crowd members, animals, or beasts. There is NO upper limit. Describe each character's consistent features perfectly in the "characters" list so the prompt engine can refer to them cleanly. This allows complex multi-character scenes, large scale battles, or populous cityscapes.

CHARACTER VISUAL CONTINUITY:
- You MUST carry over precise, identical visual elements for each character from scene to scene. In each scene prompt, describe characters using the EXACT same clothing description, hair style, age, color scheme, facial features, and accessories defined in their character extraction list. Never alter their baseline outfit or facial characteristics randomly between scenes.

AUTOMATIC SCENE CORRELATION & CINEMATIC CONTINUITY:
- All scenes MUST be visually interconnected and tightly matched in:
  * Character descriptions, facial structures, hair, exact outfits, and accessories.
  * Consistency of clothing materials, colors, and textures across scenes.
  * Continuous lighting moods, color palettes, background setups, and environmental details when scenes share a location.
  * Logical camera progression (e.g. tracking a dialogue scene seamlessly).

AUTOMATIC CINEMATIC INTELLIGENCE:
- Design scenes with professional staging, cinematography, and composition:
  * Alternate logically between establishing shots (wide angles), interactive master shots (medium shots), and highly expressive close-ups (intimate emotions, detailed facial features, shallow depth of field, off-camera gaze).
  * Ingress transition or insert shots (focusing on hands working dynamically, footsteps, or significant items) to create a beautiful, dynamic, natural cinematic rhythm.

STUDIO-GRADE PROMPT ENGINEERING SYSTEM (PIXAR, DISNEY, DREAMWORKS, NETFLIX LEVEL):
- Your prompt output for all categories must be highly evocative, visually granular, immersive, and professional. Avoid static descriptions, generic templates, or repeating the same phrasing ("detailed", "high quality") over and over.

1. CHARACTER PROMPTS (PERSONNAGES):
   * Create comprehensive character look definitions. Avoid lazy summaries.
   * Detail physical features (hair texture, expressive eye color with natural light reflections, subtle skin/surface sheen).
   * Specify fabrics, textures, and garments (e.g., "scuffed dark leather jerkin with heavy stitching", "fine woven crimson silk collar").
   * Add posture, attitude, and visual style markers (e.g., "gentle, inquisitive stance", "heroic stature with soft hand poses") matching the animation format.

2. CINEMATIC SCENE PROMPTS (DÉCOUPAGE DES SCÈNES):
   * Write rich, multi-layered visual prompts. Every scene prompt must feel unique, descriptive, and emotionally charged.
   * Integrate cinematic light sources: e.g., "warm subterranean candle glow casting deep volumetric shadows", "soft cool morning fog filtering rim light on shoulders", "backlit neon glare with subtle chromatic dispersion".
   * Specify rich compositions and camera metrics: "intimate high-angle close-up with shallow depth-of-field", "dynamic low-angle wide shot emphasizing the scale of the canyon", "deliberate rule-of-thirds balance".
   * Define ambient micro-textures and environmental layers: e.g., "rising steam particles hovering above the tea", "glistening raindrops sliding slowly down the grimy window pane", "scratched mahogany textures".
   * State precise, nuanced facial expressions and micro-emotions matching the performance (e.g., "eyebrows knitted slightly in nostalgic yearning", "a fleeting, nervous half-smile with eyes widened in wonder").
   * IMPORTANT: Prefix each scene prompt with "You are a professional image generator. Do not change the character's identity, face, outfit, or colors. Strictly follow the prompt instructions. " to ensure character references function flawlessly.

3. EMPTY SCENE GENERATOR PROMPTS (SCÈNE VIDE):
   * Create highly detailed backdrop prompts of the EXACT environment from the scene, but with ABSOLUTELY no characters, human silhouettes, shadows, or reflections of people.
   * The setting must look active, living, and tactile even when vacant: describe whispering winds, flickering candles, drifting light-motes, morning mist, or physical relics (e.g., "a warm resting typewriter with blank paper, a soft lamp casting ambient shadows on the wall").
   * Retain identical camera angle, lighting direction, weather, color palette, spatial geometry, and illustration style to guarantee continuous visual matching between the main scene and this empty backdrop.

4. IMAGE-TO-VIDEO & VIDEO PROMPTS (IMAGE VERS VIDÉO):
   * Describe highly professional physical camera movements: "smooth, cinematic slow zoom-in with subtle physical camera drift and parallax", "gentle orbital panning shot around the wooden desk", "slow vertical crane down starting from the rafters and landing on the floor".
   * Detail delicate micro-movements of characters and scenery: "gentle hair strands swaying in the draft", "subtle changing expressions like a blink or nervous mouth twitch", "wind rustling the forest trees in the background", "candle flame dancing slowly".
   * Retain realistic movement speeds and physical depth to make it feel like a genuine, high-budget, premium animated film.

5. CINEMATIC CONTINUITY ENGINE (CRITICAL REQUIREMENT):
   * You are a professional cinematic continuity engine specialized in AI storyboard generation, animated scene sequencing, and image-to-video consistency.
   * Your primary task is to maintain PERFECT visual continuity between consecutive scenes.
   * Do NOT generate a separate START FRAME or separate LTX_2 START IMAGE anymore. Always consider the current merged image (character + environment) as the official START FRAME of the scene.
   * For every scene, you MUST automatically generate ONLY these three continuity fields:
     - endFramePrompt: Describe a detailed, cinematic visual layout of the ending frame of the scene. The end frame of the current scene naturally continues the current shot, visually connects to the next scene, and preserves identical camera angle, lighting, environment, character design, composition, color palette, and lens style. It serves as the starting reference for the next scene.
     - transitionContinuity: Provide explicit, detailed, developer/director-level continuity instructions explaining how the current scene's merged image flows and morphs smoothly into its End Frame (which represents the starting reference for the next scene). Emphasize preserving identical clothing, lighting, angle, and environment.
     - ltxTransitionEndPrompt: A detailed, highly technical image prompt optimized for LTX_2 end image input, naturally connecting to the next generated scene to reduce scene drifting and visual inconsistency during video synthesis. Preserve visual memory from the current scene.

CHARACTER GAZE & DIRECT EYE CONTACT REMOVAL (CRITICAL):
- Character prompts ('prompt' field) must be highly detailed and describe a single, full-body standing pose of the character (e.g. standing pose). Crucially, the character's eye contact and direction of gaze MUST NOT look directly at the camera under any circumstances unless explicitly requested by the script or story; instead, their eye contact, look, head direction, and face expressions MUST follow the script or story context (e.g. looking away, looking downwards or sideways, focused on actions/objects). Do NOT generate character sheets, multi-angle views, side profiles, back views, or split images in the prompt itself. Ensure the composition displays a single character only with a complete standing figure from head to toe (all the way from the hair/head down to the feet/shoes), with no duplicate, clone, twin, or secondary characters in the image.
- Each character prompt ('prompt' field) MUST end with the suffix: "standing full-body, single character, complete from head to toe, looking away from the camera, eye gaze adapted to the story context and not directly looking at the camera lens under any circumstances unless specified".
- Each character MUST have a highly detailed negative prompt ('negativePrompt' field) in English, explicitly outlining the restrictions. Example: "Do not generate multiple characters, no duplicate character, do not generate multiple views, do not split the image, do not show side profile, do not show back view, no character sheets, no collage, no twin characters, no cloning, no asymmetric face expressions, no low quality, no extra limbs, no bad body proportions, no distorted face, no multiple poses, looking directly at camera, direct eye contact, facing camera, looking into lens (unless requested in script)." Customize this negative prompt based on the style to ensure high aesthetic output (e.g., if realistic, include cartoonish / sketch words in negative prompt, etc.).

SCENE PROMPTS & REALISM:
- REALISTIC STYLE RULE: If the "Animation style" is "realistic" or "Cinematic Realistic", you MUST avoid all cartoonish, stylized, or hand-drawn terms. Instead, use photography-focused keywords like "RAW photo", "8k UHD", "high-resolution photorealism", "hyper-realistic skin textures", "cinematic film stock", "natural lighting", and "meticulous detail". The results must look like actual human beings in real-world settings.
- Scene prompts (the 'prompt' field) MUST focus heavily on highly cinematic, tight, and close-up views (close-up shots, medium close-ups, extreme close-ups, conversational framing) as if it were a real movie, ensuring the subjects are shown up close with extreme facial/emotional clarity, intimate physical interactions, very shallow depth of field, cinematic lighting, and highly detailed textures of expressions, eyes, skin, and fabrics close to the lens. Crucially, in every scene prompt, characters MUST NEVER look directly at the camera; their gaze should always be focused on the action, objects, other characters, or off-camera directions (never making direct eye contact with the viewer/camera lens) to preserve a realistic cinematic film quality. Their gaze must follow the scene context exactly: if reading a book they must look down at the book, if holding a map they must look at the map, if speaking to or interacting with another character they must look at that character, if walking in a dark hallway they must look forward towards their path. Avoid distant, wide, or far-away compositions. Describe the scene elements vividly with detailed hand actions, object focus, volumetric lighting, and deep cinematic shadows.
- Every generated scene prompt (the 'prompt' field) must include the character reference clause: "You are a professional image generator. Do not change the character's identity, face, outfit, or colors. Strictly follow the prompt instructions. " as a prefix. Do not add any sentences about providing character reference images or views from multiple angles in the generated scene or character prompts.
- Every generated scene's negative prompt (the 'negativePrompt' field) must include the clause: "Do not generate multiple images of a character in one single image, do not split the image into multiple images, looking directly at camera, direct eye contact with the viewer, looking at lens, looking at the camera." as part of the negative prompt.
- Output MUST be valid JSON matching the provided schema.
- CRITICAL: In the "videoPrompt" (Image to Video) and "dialogue" fields, any spoken text MUST strictly follow the format "Character Name: Dialogue Text".
- SEQUENTIAL PROMPT RULE: The "sequentialVideoPrompt" is for video generation (Image-to-Video). It must describe the scene as a direct continuation of the previous scene's LAST FRAME if the location is the same. It should explain the action transition (e.g. "Character opens the fridge that was closed in the last scene") and include relevant movement and dialogue. This allows the video AI to seamlessly stitch scenes together.
- EMPTY SCENE GENERATOR RULE: In the "emptyScenePrompt" field, generate a detailed prompt of the exact same environment/background of the current scene but without any characters, human shadows, or character reflections. It must retain identical space design, lighting, camera angles, weather, colors, and art/drawing style.
- DETAILED CINEMATIC PRODUCTION FIELDS:
  Ensure the following fields are generated in high-fidelity descriptive movie-production prose:
  * camera: Describe camera perspective, movement, framing, and camera lens style dynamically (e.g. "intimate over-the-shoulder tracking dolly, slow vertical crane boom, extreme shallow depth-of-field telephoto focus").
  * characterActions: Specify body movement, expressive postures, micro-emotions, and realistic physical gestures (e.g., "gentle standing pose, fingers twitching nervously, eyes narrowed slightly in sudden realization").
  * environmentMotion: Outline environmental physics (clouds drifting slow, weather particles like fog or wind-swept snow, clothes/cape/hair billowing).
  * lighting: Elaborate on lighting direction, colors, shadows, and reflection states (e.g. "chiaroscuro candle halo casting deep volumetric shadows against the brick background").
  * soundDesign: Mention atmospheric sound effects, design layers, low hums, mechanical purrs, or distinct sharp noises (e.g., "echoing footsteps on hardwood, distant thunder rumbling, a soft ticks of an antique clock").
  * emotionalAtmosphere: Write the psychological subtext and emotional energy (e.g. "melancholy suspense, warm nostalgic wonder").
  * PROMPT ENGINEERING SPECIALIZATION: You are a professional AI prompt engineer specialized in cinematic anime, manga, stickman animation, and experimental visual effects. Rewrite every visual scene prompt ('prompt', 'videoPrompt', 'sequentialVideoPrompt') into an ultra-detailed, cinematic visual generation prompt using an advanced artistic vocabulary describing: perspective, motion, atmosphere, textures, visual effects, lighting, and composition. Never generate basic or generic prompts. Always output immersive, production-ready prompts!
- CHARACTER VISUAL CONTINUITY WITHIN SCENE: If the reference scene contains a character, keep the character's facial features, outfit, colors, expressions, location, camera angle, and drawing style consistent in the scene prompt.
- SCENE SIMILARITY RULE: All scenes must be visually closely matched (matching colors, lighting, camera angles, layouts, elements, and styles) to enable smooth transitions with minimal frame shifts when converted to video.
`;

async function generateStory(storyInput, config = {}, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `
STORY INPUT:
${storyInput}

CONFIGURATION:
- Target / Minimum Number of scenes: ${config.sceneCount || 5} (You can dynamically expand this up to 12+ scenes to maintain smooth narrative transitions, action continuity, and logical scene-by-scene sequencing)
- Animation style: ${config.style || 'auto'}${config.customStyle ? ` (${config.customStyle})` : ''}
- Aspect ratio: ${config.aspectRatio || '16:9'}
- Output Language: ${langName}
- Tone: ${config.tone || 'auto'}
- Target age group: ${config.ageGroup || 'all ages'}
- Visual richness: ${config.visualRichness || 'cinematic'}

CONTINUITY & ENHANCEMENT DIRECTIONS:
- Automatically map all relevant characters (unlimited characters allowed, do not truncate character list!).
- Enforce character visual continuity strictly: outfits, colors, face, hair, and accessories MUST be consistent throughout.
- Adapt characters' look direction: enforce that they do not look at the camera, but rather focus their gaze on scene assets/actions/other characters.
- Design scenes cinematographically with high-end transitions (continuity notes should reflect this step-by-step).

LANGUAGE RULES:
- English remains the language of visual prompts (prompt, videoPrompt, sequentialVideoPrompt, emptyScenePrompt, endFramePrompt, ltxTransitionEndPrompt) to maximize layout fidelity across generation platforms.
- ALL user-facing fields (title, hook, synopsis, condensedStory, character names, character roles, scene titles, scene purposes, dialogue, continuity notes, camera, characterActions, environmentMotion, lighting, soundDesign, emotionalAtmosphere) MUST be ENTIRELY in ${langName}, regardless of the language of the story input above.

OUTPUT:
Return a JSON object matching this exact shape (all keys required unless noted), and NOTHING else — no markdown, no commentary:
{
  "title": "<story title>",
  "hook": "<one punchy hook line>",
  "synopsis": "<2-3 sentence synopsis>",
  "condensedStory": "<concise narrative version of the input>",
  "characters": [
    { "id": "<slug>", "name": "<name>", "role": "<role in the story>", "prompt": "<full character appearance prompt, English>", "negativePrompt": "<negative prompt, English>" }
  ],
  "scenes": [
    {
      "id": "<slug>", "number": <int>, "title": "<scene title>", "purpose": "<narrative purpose of this scene>",
      "sceneCharacters": "<which characters appear>", "prompt": "<main image prompt, English>",
      "continuityNotes": "<continuity notes>", "negativePrompt": "<negative prompt, English>",
      "videoPrompt": "<image-to-video prompt, English>", "sequentialVideoPrompt": "<sequential video prompt, English>",
      "dialogue": "<dialogue if any, format 'Character Name: text'>",
      "emptyScenePrompt": "<empty backdrop prompt, English>", "endFramePrompt": "<end frame prompt, English>",
      "ltxTransitionEndPrompt": "<LTX-2 end image prompt, English>", "transitionContinuity": "<continuity instructions>",
      "camera": "<camera description>", "characterActions": "<character actions/body language>",
      "environmentMotion": "<environment motion/physics>", "lighting": "<lighting description>",
      "soundDesign": "<sound design>", "emotionalAtmosphere": "<emotional subtext>"
    }
  ],
  "continuity": { "characters": "<summary>", "lighting": "<summary>", "costume": "<summary>", "environment": "<summary>", "tone": "<summary>", "timeline": "<summary>" }
}`;
  /* Au-delà de 10 scènes, le JSON de sortie est trop volumineux pour tenir de façon fiable
     dans la limite de sortie de Cloudflare Workers AI (gratuit) — il se tronquerait
     silencieusement. story.js réserve ce cas aux comptes payants : on appelle Gemini
     directement (pas d'essai Cloudflare) pour garantir une sortie complète. */
  if ((config.sceneCount || 5) > 10) {
    return parseJson(await callGemini(STORY_SYSTEM_INSTRUCTION + '\n\n' + prompt, 8000));
  }
  return geminiJson(STORY_SYSTEM_INSTRUCTION + '\n\n' + prompt, 8000);
}

/* Développe une simple phrase/idée en une histoire complète (avant le découpage en scènes). */
async function expandStoryIdea(idea, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Expand the following rough idea into a full, coherent animated story with a beginning, middle, and end.
Make it visually rich and suitable for animation.
The expanded story MUST be ENTIRELY in ${langName}.

IDEA:
${idea}

Réponds UNIQUEMENT en JSON valide : {"text": "<histoire développée>"}`;
  return geminiJson(prompt, 1800);
}

/* Résume un texte/script long (ex: extrait d'un document) en un récit condensé exploitable. */
async function summarizeStoryText(text, language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Summarize the following story text (e.g. extracted from an uploaded document) into a coherent narrative usable for an animation scene breakdown.
The summary MUST be ENTIRELY in ${langName}.
CRITICAL: the summary must be concise and NOT exceed 5000 characters.

TEXT:
${text.slice(0, 20000)}

Réponds UNIQUEMENT en JSON valide : {"text": "<résumé>"}`;
  return geminiJson(prompt, 1500);
}

module.exports = { callGemini, callTextAI, callCloudflareText, generateTitles, generateReport, generateCompetitorInsights, generateDescription, generateTags, analyzeThumbnail, generateThumbnailImage, thumbnailIdeas, compareTitles, generateShorts, compareThumbnails, analyzeHook, optimizeAudience, generateVideoPackage, estimateRevenue, generateChannelReport, analyzeComments, generateChapters, generateVideoIdeas, keywordOpportunity, titleDoctor, sponsorKit, generateContentPlan, translateMetadata, generateCommunityPosts, generateScript, pairCheck, optimizePlaylists, detectTrends, generateHashtags, bestPublishTime, generateTikTokSEO, tiktokRepurpose, tiktokViralIdeas, tiktokHooks, tiktokCalendar, tiktokRepurposeTimed, generateInstagramSEO, instagramViralIdeas, instagramHooks, instagramCalendar, instagramRepurposeTimed, instagramRepurpose, supportChat, coachChat, generateStory, expandStoryIdea, summarizeStoryText };
