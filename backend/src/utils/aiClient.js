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

/* A/B Test de MINIATURES : décrit 2 images via Vision puis prédit celle qui aura le meilleur CTR */
async function compareThumbnails(imageA, imageB, language = 'fr') {
  const langName = LANG_NAMES[language] || language;

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
    {"keyword": "<mot-clé long-tail à fort potentiel, lié à '${query}'>", "difficulty": "facile" | "moyen" | "difficile", "why": "<pourquoi en ${langName}>"}
  ]
}
Donne 4 à 6 best_keywords (privilégie les long-tail faciles à classer). Tout en ${langName}.`;
  return geminiJson(prompt, 1500);
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

module.exports = { callGemini, generateTitles, generateReport, generateCompetitorInsights, generateDescription, generateTags, analyzeThumbnail, generateThumbnailImage, compareTitles, generateShorts, compareThumbnails, analyzeHook, optimizeAudience, generateVideoPackage, estimateRevenue, generateChannelReport, analyzeComments, generateChapters, generateVideoIdeas, keywordOpportunity };
