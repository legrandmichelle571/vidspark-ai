/**
 * Routes PUBLIQUES (sans authentification) — outils SEO gratuits du site.
 * Sert de lead magnet : extracteur de tags / miniatures depuis une URL YouTube.
 */
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { getVideoStats, getVideoComments } = require('../utils/youtube');
const {
  generateTags, generateTitles, generateDescription,
  compareTitles, compareThumbnails, analyzeThumbnail,
  analyzeHook, generateShorts, generateVideoIdeas,
  optimizeAudience, estimateRevenue, analyzeComments,
  titleDoctor
} = require('../utils/aiClient');
const { requireAuth } = require('../middleware/auth');

/* Outils IA du site : réservés aux abonnés Pro/Business connectés */
function requireProPlan(req, res, next) {
  const plan = (req.user?.plan || '').toLowerCase();
  if (!['pro', 'business', 'diamant'].includes(plan)) {
    return res.status(403).json({
      error: 'Outil réservé aux abonnés Pro et Business. Passe à Pro pour y accéder !',
      code: 'UPGRADE_REQUIRED'
    });
  }
  next();
}

/* Garde une limite raisonnable même pour les abonnés (anti-abus) */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite horaire atteinte, réessaie dans un moment.', code: 'RATE_LIMIT' }
});

/* Extrait l'ID vidéo d'une URL YouTube (ou accepte un ID brut) */
function extractId(input) {
  if (!input) return null;
  const s = String(input).trim();
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

/* GET /api/public/video?url=... → titre, tags, miniatures (lecture seule) */
router.get('/video', async (req, res) => {
  try {
    const id = extractId(req.query.url || req.query.videoId || '');
    if (!id) return res.status(400).json({ error: 'URL ou ID YouTube invalide' });

    const v = await getVideoStats(id);
    if (!v) return res.status(404).json({ error: 'Vidéo introuvable' });

    res.json({
      videoId:        id,
      title:          v.title,
      channel:        v.channel,
      views:          v.views,
      tags:           v.tags || [],
      engagement_rate:v.engagement_rate,
      duration:       v.duration,
      thumbnails: {
        max: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        hq:  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        sd:  `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
        mq:  `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
      }
    });
  } catch (err) {
    console.error('[PUBLIC/VIDEO]', err.message);
    res.status(500).json({ error: 'Service indisponible', details: err.message });
  }
});

/* POST /api/public/ai/tags {topic, language} → 15 tags SEO (gratuit, rate-limité) */
router.post('/ai/tags', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { topic, language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: 'Sujet requis (3 caractères min)' });
    res.json(await generateTags(topic.slice(0, 150), language));
  } catch (err) {
    console.error('[PUBLIC/AI-TAGS]', err.message);
    res.status(500).json({ error: 'Génération indisponible' });
  }
});

/* POST /api/public/ai/titles {topic, language} → 5 titres optimisés */
router.post('/ai/titles', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { topic, language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: 'Sujet requis (3 caractères min)' });
    res.json(await generateTitles(topic.slice(0, 150), language));
  } catch (err) {
    console.error('[PUBLIC/AI-TITLES]', err.message);
    res.status(500).json({ error: 'Génération indisponible' });
  }
});

/* POST /api/public/ai/description {topic, language} → description + hashtags */
router.post('/ai/description', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { topic, language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: 'Sujet requis (3 caractères min)' });
    res.json(await generateDescription(topic.slice(0, 150), language));
  } catch (err) {
    console.error('[PUBLIC/AI-DESC]', err.message);
    res.status(500).json({ error: 'Génération indisponible' });
  }
});

/* POST /api/public/ai/viral-score {title, description, language} */
router.post('/ai/viral-score', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { title, description = '', language = 'fr' } = req.body;
    if (!title || title.trim().length < 3) return res.status(400).json({ error: 'Titre requis' });
    const result = await titleDoctor(title.trim(), language);
    // Enrichit avec description si fournie
    res.json({
      current_score: result.score || 0,
      potential_score: Math.min(100, (result.score || 0) + (result.potential_gain || 15)),
      factors: result.criteria || [],
      suggestion: result.improved_title || null
    });
  } catch (err) {
    console.error('[PUBLIC/VIRAL-SCORE]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/ab-test-titles {title_a, title_b, language} */
router.post('/ai/ab-test-titles', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { title_a, title_b, language = 'fr' } = req.body;
    if (!title_a || !title_b) return res.status(400).json({ error: 'Les deux titres sont requis' });
    const result = await compareTitles(title_a.trim(), title_b.trim(), language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/AB-TITLES]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/ab-test-thumbnails {image_a, image_b, language} */
router.post('/ai/ab-test-thumbnails', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { image_a, image_b, language = 'fr' } = req.body;
    if (!image_a || !image_b) return res.status(400).json({ error: 'Les deux images sont requises' });
    const result = await compareThumbnails(image_a, image_b, language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/AB-THUMBS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/thumbnail-analyzer {image_base64, language} */
router.post('/ai/thumbnail-analyzer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { image_base64, language = 'fr' } = req.body;
    if (!image_base64) return res.status(400).json({ error: 'Image requise' });
    const result = await analyzeThumbnail(image_base64, '', language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/THUMBNAIL]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/hook-analyzer {hook, language} */
router.post('/ai/hook-analyzer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { hook, language = 'fr' } = req.body;
    if (!hook || hook.trim().length < 20) return res.status(400).json({ error: 'Intro trop courte (20 caractères min)' });
    const result = await analyzeHook(hook.trim(), language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/HOOK]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/shorts-generator {topic, description, language} */
router.post('/ai/shorts-generator', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { topic, description = '', language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: 'Sujet requis' });
    const result = await generateShorts(topic.trim(), language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/SHORTS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/video-ideas {niche, topic, language} */
router.post('/ai/video-ideas', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { niche, topic = '', language = 'fr' } = req.body;
    if (!niche || niche.trim().length < 2) return res.status(400).json({ error: 'Niche requise' });
    const result = await generateVideoIdeas(niche.trim(), '', topic.trim(), language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/IDEAS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/audience-optimizer {niche, region, language} */
router.post('/ai/audience-optimizer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { niche, region = 'FR', language = 'fr' } = req.body;
    if (!niche || niche.trim().length < 2) return res.status(400).json({ error: 'Niche requise' });
    const result = await optimizeAudience(niche.trim(), language, language, region);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/AUDIENCE]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/revenue-estimator {niche, subscribers, country, language} */
router.post('/ai/revenue-estimator', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { niche, subscribers = 0, country = 'FR', language = 'fr' } = req.body;
    if (!niche || niche.trim().length < 2) return res.status(400).json({ error: 'Niche requise' });
    const result = await estimateRevenue('', niche.trim(), country, subscribers, language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/REVENUE]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/comment-analyzer {video_url, language} */
router.post('/ai/comment-analyzer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { video_url, language = 'fr' } = req.body;
    if (!video_url) return res.status(400).json({ error: 'URL de vidéo requise' });
    const m = String(video_url).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
    if (!m) return res.status(400).json({ error: 'URL YouTube invalide' });
    const videoId = m[1];
    let comments = [];
    try { comments = await getVideoComments(videoId, 40); } catch (e) { /* clé API optionnelle */ }
    if (!comments.length) return res.json({ empty: true, sentiment: 'neutre', positive_pct: 0, negative_pct: 0 });
    const result = await analyzeComments(comments, '', language);
    res.json(result);
  } catch (err) {
    console.error('[PUBLIC/COMMENTS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* ── Pubs du site (publiques) — affichées sur l'accueil et le dashboard ── */
router.get('/ads', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const keys = ['ad_home', 'ad_home_left', 'ad_home_right', 'ad_dashboard', 'ad_dashboard_right'];
    const { data } = await supabase.from('site_config').select('key,value').in('key', keys);
    const out = {};
    (data || []).forEach(r => { out[r.key] = r.value; });
    res.json({
      home: out.ad_home || '', home_left: out.ad_home_left || '', home_right: out.ad_home_right || '',
      dashboard: out.ad_dashboard || '', dashboard_right: out.ad_dashboard_right || ''
    });
  } catch (e) {
    res.json({ home: '', dashboard: '' });
  }
});

module.exports = router;
