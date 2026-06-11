/**
 * Routes PUBLIQUES (sans authentification) — outils SEO gratuits du site.
 * Sert de lead magnet : extracteur de tags / miniatures depuis une URL YouTube.
 */
const router = require('express').Router();
const { getVideoStats } = require('../utils/youtube');

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

module.exports = router;
