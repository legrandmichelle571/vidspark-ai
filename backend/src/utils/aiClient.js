/**
 * Client IA partagé (Anthropic / Claude) + générateurs de contenu.
 * La clé API reste côté serveur uniquement.
 */

async function callAnthropic(prompt, maxTokens = 1000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages:   [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error ${response.status}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || '';
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

Chaque variante a un type différent. Réponds UNIQUEMENT en JSON valide (pas de backticks) :
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
  return parseJson(await callAnthropic(prompt, 1000));
}

/* Rapport SEO complet */
async function generateReport(title, description = '', language = 'fr') {
  const langName = LANG_NAMES[language] || language;
  const prompt = `Tu es un expert YouTube SEO. Analyse ce titre et cette description en ${langName}.

Titre : "${title}"
Description (${description.length} caractères) : "${description.slice(0, 400)}"

Réponds UNIQUEMENT en JSON valide (pas de backticks) :
{
  "score": <0-100>,
  "viral_score": <0-100>,
  "viral_reason": "<analyse en ${langName}, 2-3 phrases>",
  "checklist": [
    {"item": "<problème ou point>", "detail": "<explication courte>", "status": "ok|fix"}
  ],
  "suggestions": ["<conseil concret 1 en ${langName}>", "<conseil 2>", "<conseil 3>", "<conseil 4>"]
}`;
  return parseJson(await callAnthropic(prompt, 1400));
}

/* Analyse concurrentielle (basée IA, sans API YouTube) */
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
  return parseJson(await callAnthropic(prompt, 900));
}

module.exports = { callAnthropic, generateTitles, generateReport, generateCompetitorInsights };
