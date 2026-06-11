/**
 * Routes PUBLIQUES (sans authentification) — outils SEO gratuits du site.
 * Sert de lead magnet : extracteur de tags / miniatures depuis une URL YouTube.
 */
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { getVideoStats } = require('../utils/youtube');
const { generateTags, generateTitles, generateDescription } = require('../utils/aiClient');
const { requireAuth } = require('../middleware/auth');

/* Outils IA du site : réservés aux abonnés Pro/Business connectés */
function requireProPlan(req, res, next) {
  if (!['pro', 'business'].includes((req.user?.plan || '').toLowerCase())) {
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

module.exports = router;
