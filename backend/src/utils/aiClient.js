/**
 * Client IA partagé (Google Gemini) + générateurs de contenu.
 * La clé API reste côté serveur uniquement (process.env.GEMINI_API_KEY).
 */

async function callGemini(prompt, maxTokens = 1000) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const key   = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY manquante');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens:  maxTokens,
        temperature:      0.8,
        responseMimeType: 'application/json'   // force une sortie JSON propre
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJson(text) {
  return JSON.parse(text.replace(/```json|```/g, '').trim());
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
  return parseJson(await callGemini(prompt, 1000));
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
  return parseJson(await callGemini(prompt, 1400));
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
  return parseJson(await callGemini(prompt, 900));
}

module.exports = { callGemini, generateTitles, generateReport, generateCompetitorInsights };
