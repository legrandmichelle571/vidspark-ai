/**
 * Routes IA — Proxy sécurisé vers Anthropic
 * Clé API reste côté serveur uniquement
 * POST /api/ai/seo-report
 * POST /api/ai/titles
 * POST /api/ai/description
 * POST /api/ai/tags
 * POST /api/ai/analysis/save
 */
const router = require('express').Router();
const { requireAuth, requirePro, checkQuota, checkTitlesQuota, checkSocialQuota } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { callTextAI, generateTikTokSEO, tiktokRepurpose, tiktokViralIdeas, tiktokHooks, tiktokCalendar, tiktokRepurposeTimed, generateInstagramSEO, instagramViralIdeas, instagramHooks, instagramCalendar, instagramRepurposeTimed } = require('../utils/aiClient');
const { getVideoStats, getTranscript, secToTimestamp, iso8601ToSeconds, extractVideoId, buildTimedTranscript } = require('../utils/youtube');

/* Dispatch des outils TikTok avancés (repurpose / ideas / hooks / calendar) */
async function runTikTokTool(tool, p = {}) {
  switch (tool) {
    case 'repurpose': return tiktokRepurpose(p.title, p.description, p.transcript, p.niche, p.language);
    case 'ideas':     return tiktokViralIdeas(p.niche, p.topic, p.language);
    case 'hooks':     return tiktokHooks(p.topic, p.niche, p.language);
    case 'calendar':  return tiktokCalendar(p.niche, p.frequency, p.language);
    default: throw new Error('Outil TikTok inconnu');
  }
}

/* Dispatch des outils Instagram avancés (ideas / hooks / calendar) — même principe
   que runTikTokTool ci-dessus. Pas de cas 'repurpose' ici : côté TikTok ce cas
   (tiktokRepurpose, sans timecodes) n'est jamais appelé par le frontend, qui utilise
   exclusivement la route dédiée /*-repurpose (avec timecodes réels, voir plus bas) —
   on ne duplique pas ce code mort pour Instagram. */
async function runInstagramTool(tool, p = {}) {
  switch (tool) {
    case 'ideas':    return instagramViralIdeas(p.niche, p.topic, p.language);
    case 'hooks':    return instagramHooks(p.topic, p.niche, p.language);
    case 'calendar': return instagramCalendar(p.niche, p.frequency, p.language);
    default: throw new Error('Outil Instagram inconnu');
  }
}

/* Rate limit global : 10 appels IA / minute */
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many AI requests. Please wait a moment.' }
});

/* ── Helper: appel IA ──
   Même chaîne que le reste du projet : Cloudflare Workers AI d'abord (gratuit),
   Gemini en secours. Renvoie du TEXTE (JSON) que les routes parsent ensuite.
   Évite la dépendance Anthropic (non configurée sur Railway). */
async function callAnthropic(prompt, maxTokens = 1000) {
  return callTextAI(prompt, maxTokens);
}

/* Incrémente un quota côté DB et logue (sans throw) si l'appel RPC échoue.
   Garde-fou contre les échecs silencieux (cf. bug param p_user_id/user_uuid). */
async function bumpQuota(supabase, fn, userId, tag) {
  const { error } = await supabase.rpc(fn, { p_user_id: userId });
  if (error) console.error(`[${tag}] RPC ${fn} a échoué:`, error.message);
}

/* ── Rapport SEO IA ──────────────────────────────────────────────
   checkQuota : appliqué à Free, Pro ET Business
   quota_used incrémenté pour TOUS les plans après succès
──────────────────────────────────────────────────────────────── */
router.post('/seo-report', requireAuth, checkQuota, aiRateLimit, async (req, res) => {
  try {
    const { videoId, title, description, language = 'fr' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const langNames = {
      fr:'français', en:'english', ar:'arabe', es:'espagnol',
      de:'allemand', ru:'russe',   ja:'japonais', ko:'coréen', zh:'chinois'
    };
    const langName = langNames[language] || language;

    const prompt = `Tu es un expert YouTube SEO. Analyse ce titre et cette description YouTube en ${langName}.

Titre : "${title}"
Description (${description?.length || 0} caractères) : "${(description || '').slice(0, 300)}"

Réponds UNIQUEMENT en JSON valide (pas de backticks, pas de commentaires) :
{
  "score": <nombre 0-100>,
  "viral_score": <nombre 0-100>,
  "viral_reason": "<analyse en ${langName}, 2-3 phrases>",
  "checklist": [
    {"item": "<problème>", "detail": "<explication>", "status": "ok|fix"}
  ],
  "suggestions": ["<suggestion 1 en ${langName}>", "<suggestion 2>", "<suggestion 3>"]
}`;

    const text   = await callAnthropic(prompt);
    const clean  = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    const supabase = req.app.locals.supabase;

    /* Sauvegarder dans l'historique */
    if (videoId) {
      await supabase.from('analysis_history').upsert({
        user_id:        req.user.id,
        video_id:       videoId,
        title,
        score_seo:      result.score,
        score_viral:    result.viral_score,
        checklist_data: { checklist: result.checklist, suggestions: result.suggestions },
        ai_report:      result
      }, { onConflict: 'user_id,video_id' });
    }

    await bumpQuota(supabase, 'increment_user_quota', req.user.id, 'AI/SEO');

    res.json(result);
  } catch (err) {
    console.error('[AI/SEO]', err.message);
    if (err.message.includes('JSON')) {
      return res.status(500).json({ error: 'AI response parsing failed' });
    }
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

/* ── Titres IA ───────────────────────────────────────────────────
   checkTitlesQuota : bloque Free, limite Pro à 100/jour, Business à 500/jour
   titles_used incrémenté pour Pro ET Business après succès
──────────────────────────────────────────────────────────────── */
router.post('/titles', requireAuth, checkTitlesQuota, aiRateLimit, async (req, res) => {
  try {
    const { title, description, language = 'fr' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const prompt = `Tu es un expert YouTube SEO et copywriter.
Génère 5 variantes de titres YouTube optimisés basés sur ce titre original : "${title}"

Chaque variante doit avoir un type différent. Réponds UNIQUEMENT en JSON :
{
  "titles": [
    {"text": "<titre version SEO>",      "hook": "SEO",     "score": <0-100>},
    {"text": "<titre version CTR>",      "hook": "CTR",     "score": <0-100>},
    {"text": "<titre version Virale>",   "hook": "Viral",   "score": <0-100>},
    {"text": "<titre version Shorts>",   "hook": "Shorts",  "score": <0-100>},
    {"text": "<titre version Trending>", "hook": "Trending","score": <0-100>}
  ]
}

Langue: ${language}. Titres entre 55-70 caractères idéalement.`;

    const text   = await callAnthropic(prompt);
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    /* Incrémenter titles_used — tous les plans avec accès (Pro/Business) */
    await bumpQuota(req.app.locals.supabase, 'increment_titles_quota', req.user.id, 'AI/TITLES');

    res.json(result);
  } catch (err) {
    console.error('[AI/TITLES]', err.message);
    res.status(500).json({ error: 'Titles generation failed' });
  }
});

/* ── Description IA (Pro/Business) ───────────────────────────────
   requirePro : Free bloqué
   checkQuota : limite journalière analyses appliquée
   quota_used incrémenté après succès
──────────────────────────────────────────────────────────────── */
router.post('/description', requireAuth, requirePro, checkQuota, aiRateLimit, async (req, res) => {
  try {
    const { title, description, language = 'fr' } = req.body;

    const prompt = `Génère une description YouTube SEO optimisée pour cette vidéo.
Titre: "${title}"
Description actuelle (${description?.length || 0} chars): "${(description || '').slice(0, 200)}"

Réponds en JSON :
{
  "description": "<description optimisée 500-800 caractères avec mots-clés, timestamps fictifs, CTA>",
  "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"]
}
Langue: ${language}.`;

    const text   = await callAnthropic(prompt, 800);
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    /* Incrémenter quota_used — tous les plans */
    await bumpQuota(req.app.locals.supabase, 'increment_user_quota', req.user.id, 'AI/DESC');

    res.json(result);
  } catch (err) {
    console.error('[AI/DESC]', err.message);
    res.status(500).json({ error: 'Description generation failed' });
  }
});

/* ── Tags IA (Pro/Business) ──────────────────────────────────────
   requirePro : Free bloqué
   checkQuota : limite journalière analyses appliquée
   quota_used incrémenté après succès
──────────────────────────────────────────────────────────────── */
router.post('/tags', requireAuth, requirePro, checkQuota, aiRateLimit, async (req, res) => {
  try {
    const { title, description, language = 'fr' } = req.body;

    const prompt = `Génère des tags YouTube optimisés pour cette vidéo.
Titre: "${title}"

Réponds en JSON :
{
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"],
  "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"]
}
Langue: ${language}. Tags: 2-5 mots max chacun.`;

    const text   = await callAnthropic(prompt, 400);
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    /* Incrémenter quota_used (analyses) — tous les plans */
    await bumpQuota(req.app.locals.supabase, 'increment_user_quota', req.user.id, 'AI/TAGS');

    res.json(result);
  } catch (err) {
    console.error('[AI/TAGS]', err.message);
    res.status(500).json({ error: 'Tags generation failed' });
  }
});

/* ── SEO TikTok : suite complète (légende, hooks, hashtags, script, mots-clés…)
   Accessible à tous les plans connectés, quota dédié daily_social (checkSocialQuota,
   voir plans.js) — plus restrictif pour Free que le quota d'analyses général. ── */
router.post('/tiktok-seo', requireAuth, checkSocialQuota, aiRateLimit, async (req, res) => {
  try {
    const { topic, niche = '', description = '', language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: 'Sujet requis' });

    const result = await generateTikTokSEO(topic, niche, description, language);

    /* Incrémenter social_used — tous les plans */
    await bumpQuota(req.app.locals.supabase, 'increment_social_quota', req.user.id, 'AI/TIKTOK');

    res.json(result);
  } catch (err) {
    console.error('[AI/TIKTOK-SEO]', err.message);
    res.status(500).json({ error: 'TikTok SEO generation failed' });
  }
});

/* ── Outils TikTok avancés : repurpose YouTube→TikTok, idées virales, hooks, calendrier
   Accessible à tous les plans connectés, quota dédié daily_social (voir ci-dessus). ── */
router.post('/tiktok-tool', requireAuth, checkSocialQuota, aiRateLimit, async (req, res) => {
  try {
    const { tool } = req.body;
    if (!tool) return res.status(400).json({ error: 'Outil requis' });
    const result = await runTikTokTool(tool, req.body);
    await bumpQuota(req.app.locals.supabase, 'increment_social_quota', req.user.id, 'AI/TIKTOK-TOOL');
    res.json(result);
  } catch (err) {
    console.error('[AI/TIKTOK-TOOL]', err.message);
    res.status(500).json({ error: 'TikTok tool generation failed' });
  }
});

/* ── YouTube → TikTok HORODATÉ : lien YouTube → clips avec timecodes (début→fin)
   Récupère la transcription horodatée de la vidéo puis l'IA propose les découpes. ── */
router.post('/tiktok-repurpose', requireAuth, checkSocialQuota, aiRateLimit, async (req, res) => {
  try {
    const { url = '', language = 'fr' } = req.body;
    const videoId = extractVideoId(url);
    if (!videoId) return res.status(400).json({ error: 'Lien YouTube invalide' });

    const [stats, tr] = await Promise.all([
      getVideoStats(videoId).catch(() => null),
      getTranscript(videoId).catch(() => ({ available: false, segments: [] }))
    ]);
    if (!tr.available || !tr.segments.length) {
      // YouTube exige désormais un jeton généré par un vrai navigateur pour servir les
      // sous-titres (anti-scraping) : un appel serveur ne peut techniquement pas l'obtenir,
      // quelle que soit la vidéo. L'extension, elle, lit la transcription depuis le
      // navigateur de l'utilisateur (fiable). On l'explique honnêtement plutôt que de
      // laisser croire à un bug ponctuel ou à un problème avec cette vidéo précise.
      return res.status(422).json({
        error: "YouTube empêche la récupération des sous-titres depuis un serveur pour cette fonctionnalité. Utilise l'extension VidSpark AI directement sur la page de la vidéo : elle lit la transcription depuis ton navigateur et fonctionne de manière fiable.",
        code: 'NO_TRANSCRIPT'
      });
    }

    const timed = buildTimedTranscript(tr.segments);
    const durStr = stats?.duration ? secToTimestamp(iso8601ToSeconds(stats.duration)) : '';
    const result = await tiktokRepurposeTimed(stats?.title || '', durStr, timed, language);

    await bumpQuota(req.app.locals.supabase, 'increment_social_quota', req.user.id, 'AI/TIKTOK-REPURPOSE');
    res.json({ video: { id: videoId, title: stats?.title || '', duration: durStr }, ...result });
  } catch (err) {
    console.error('[AI/TIKTOK-REPURPOSE]', err.message);
    res.status(500).json({ error: 'Repurpose TikTok indisponible' });
  }
});

/* ── SEO Instagram : suite complète (légende, hooks, hashtags, script, mots-clés…)
   Miroir exact de /tiktok-seo, adapté au format Instagram (voir aiClient.js). ── */
router.post('/instagram-seo', requireAuth, checkSocialQuota, aiRateLimit, async (req, res) => {
  try {
    const { topic, niche = '', description = '', language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: 'Sujet requis' });

    const result = await generateInstagramSEO(topic, niche, description, language);

    await bumpQuota(req.app.locals.supabase, 'increment_social_quota', req.user.id, 'AI/INSTAGRAM');

    res.json(result);
  } catch (err) {
    console.error('[AI/INSTAGRAM-SEO]', err.message);
    res.status(500).json({ error: 'Instagram SEO generation failed' });
  }
});

/* ── Outils Instagram avancés : idées virales, hooks, calendrier ── */
router.post('/instagram-tool', requireAuth, checkSocialQuota, aiRateLimit, async (req, res) => {
  try {
    const { tool } = req.body;
    if (!tool) return res.status(400).json({ error: 'Outil requis' });
    const result = await runInstagramTool(tool, req.body);
    await bumpQuota(req.app.locals.supabase, 'increment_social_quota', req.user.id, 'AI/INSTAGRAM-TOOL');
    res.json(result);
  } catch (err) {
    console.error('[AI/INSTAGRAM-TOOL]', err.message);
    res.status(500).json({ error: 'Instagram tool generation failed' });
  }
});

/* ── YouTube → Instagram Reels HORODATÉ : lien YouTube → clips avec timecodes
   Miroir exact de /tiktok-repurpose. ── */
router.post('/instagram-repurpose', requireAuth, checkSocialQuota, aiRateLimit, async (req, res) => {
  try {
    const { url = '', language = 'fr' } = req.body;
    const videoId = extractVideoId(url);
    if (!videoId) return res.status(400).json({ error: 'Lien YouTube invalide' });

    const [stats, tr] = await Promise.all([
      getVideoStats(videoId).catch(() => null),
      getTranscript(videoId).catch(() => ({ available: false, segments: [] }))
    ]);
    if (!tr.available || !tr.segments.length) {
      return res.status(422).json({
        error: "YouTube empêche la récupération des sous-titres depuis un serveur pour cette fonctionnalité. Utilise l'extension VidSpark AI directement sur la page de la vidéo : elle lit la transcription depuis ton navigateur et fonctionne de manière fiable.",
        code: 'NO_TRANSCRIPT'
      });
    }

    const timed = buildTimedTranscript(tr.segments);
    const durStr = stats?.duration ? secToTimestamp(iso8601ToSeconds(stats.duration)) : '';
    const result = await instagramRepurposeTimed(stats?.title || '', durStr, timed, language);

    await bumpQuota(req.app.locals.supabase, 'increment_social_quota', req.user.id, 'AI/INSTAGRAM-REPURPOSE');
    res.json({ video: { id: videoId, title: stats?.title || '', duration: durStr }, ...result });
  } catch (err) {
    console.error('[AI/INSTAGRAM-REPURPOSE]', err.message);
    res.status(500).json({ error: 'Repurpose Instagram indisponible' });
  }
});

/* ── Sauvegarder analyse ── */
router.post('/analysis/save', requireAuth, async (req, res) => {
  try {
    const {
      videoId, title, views, thumbnail_url,
      score_seo, score_viral, score_thumbnail, score_global,
      seo_potential, viral_potential, ctr_estimated
    } = req.body;

    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase.from('analysis_history').upsert({
      user_id: req.user.id,
      video_id: videoId,
      title, views, thumbnail_url,
      score_seo, score_viral,
      score_thumbnail, score_global,
      seo_potential, viral_potential, ctr_estimated
    }, { onConflict: 'user_id,video_id' }).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Analysis saved', id: data.id });
  } catch (err) {
    console.error('[AI/SAVE]', err.message);
    res.status(500).json({ error: 'Save failed' });
  }
});

module.exports = router;
