/**
 * VidSpark AI — Outils 💎 Diamant (site web, auth JWT)
 * ═══════════════════════════════════════════════════════════════
 * Outils premium exclusifs réservés au plan « diamant », exposés
 * sur le dashboard du site (vidsparkpro.com), authentifiés par JWT
 * Supabase (≠ extension qui utilise activation_id/secret).
 *
 *   POST /api/diamant/channel-audit  → audit complet + score de santé
 *   POST /api/diamant/rank-check     → position d'une vidéo sur un mot-clé
 * ═══════════════════════════════════════════════════════════════
 */
const express = require('express');
const { requireAuth, requirePro } = require('../middleware/auth');
const { getChannelAudit, searchVideos, getVideoStats, getKeywordIdeas, getTrendingVideos, getVideoComments, resolveChannelId } = require('../utils/youtube');
const { analyzeComments, titleDoctor, generateTags, generateCompetitorInsights, generateTitles, generateDescription, compareTitles, generateVideoIdeas, translateMetadata } = require('../utils/aiClient');

/* Extrait l'ID d'une vidéo depuis une URL YouTube ou renvoie la valeur telle quelle */
function extractVideoId(v){
  const m = String(v || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : String(v || '').trim();
}

/* Extrait l'ID de chaîne (UC...) depuis une URL /channel/ ou renvoie la valeur */
function extractChannelId(v){
  const s = String(v || '');
  const m = s.match(/channel\/(UC[A-Za-z0-9_-]{22})/) || s.match(/(UC[A-Za-z0-9_-]{22})/);
  return m ? m[1] : s.trim();
}

/* Contrôle d'accès par palier : free<pro<business<diamant */
const TIER = { free: 0, pro: 1, business: 2, diamant: 3 };
function requireTier(min){
  return (req, res, next) => {
    if ((TIER[req.user?.plan] || 0) >= TIER[min]) return next();
    return res.status(403).json({
      error: `Forfait ${min.charAt(0).toUpperCase() + min.slice(1)} requis pour cet outil.`,
      code: 'UPGRADE_REQUIRED', required: min
    });
  };
}

const router = express.Router();

/* Calcule un score de santé /100 à partir des données d'audit.
   Quatre piliers : engagement, régularité, SEO (tags), titres. */
function computeHealthScore(a) {
  let score = 0;
  const breakdown = {};

  // 1) Engagement (max 30) — 5% d'engagement = excellent
  const eng = Math.min(30, Math.round((a.avg_engagement || 0) / 5 * 30));
  breakdown.engagement = eng; score += eng;

  // 2) Régularité d'upload (max 30) — 1 vidéo / ≤7 jours = top
  let reg = 0;
  if (a.upload_freq_days != null) {
    if (a.upload_freq_days <= 7) reg = 30;
    else if (a.upload_freq_days <= 14) reg = 22;
    else if (a.upload_freq_days <= 30) reg = 14;
    else reg = 6;
  }
  breakdown.regularite = reg; score += reg;

  // 3) SEO / usage des tags (max 25) — % de vidéos avec tags
  const seo = Math.round((a.tags_usage_pct || 0) / 100 * 25);
  breakdown.seo_tags = seo; score += seo;

  // 4) Longueur des titres (max 15) — 40 à 70 caractères = idéal
  let titleScore = 0;
  const tl = a.avg_title_length || 0;
  if (tl >= 40 && tl <= 70) titleScore = 15;
  else if (tl >= 30 && tl <= 80) titleScore = 10;
  else if (tl > 0) titleScore = 5;
  breakdown.titres = titleScore; score += titleScore;

  return { score: Math.min(100, score), breakdown };
}

/* Génère des recommandations lisibles à partir de l'audit. */
function buildRecommendations(a, health) {
  const recs = [];
  if (health.breakdown.regularite < 22)
    recs.push({ icon: '📅', text: `Publie plus régulièrement — actuellement ~1 vidéo tous les ${a.upload_freq_days ?? '?'} jours. Vise ≤ 7 jours.` });
  if (health.breakdown.seo_tags < 18)
    recs.push({ icon: '🏷️', text: `Seulement ${a.tags_usage_pct}% de tes vidéos utilisent des tags. Ajoute des tags SEO à chaque vidéo.` });
  if (health.breakdown.engagement < 18)
    recs.push({ icon: '💬', text: `Ton engagement moyen est de ${a.avg_engagement}%. Pose des questions et incite aux commentaires.` });
  if (health.breakdown.titres < 10)
    recs.push({ icon: '✍️', text: `Tes titres font ~${a.avg_title_length} caractères. Vise 40 à 70 pour un meilleur CTR.` });
  if (!recs.length)
    recs.push({ icon: '🎉', text: 'Excellente chaîne ! Continue sur cette lancée.' });
  return recs;
}

/* ── 💎 Audit de chaîne avancé ── */
router.post('/channel-audit', requireAuth, requireTier('diamant'), async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;

    // channelId fourni (ID, URL, @handle, /c/, /user/…), sinon chaîne principale de l'utilisateur
    let channelId = null;
    if (req.body.channelId) {
      const raw = String(req.body.channelId).trim();
      const uc = raw.match(/channel\/(UC[A-Za-z0-9_-]{22})/) || raw.match(/(UC[A-Za-z0-9_-]{22})/);
      if (uc) {
        channelId = uc[1];
      } else {
        // @handle, /c/Nom, /user/Nom, nom brut → on résout vers un ID UC...
        const resolved = await resolveChannelId(raw);
        if (!resolved?.id) {
          return res.status(404).json({ error: 'Chaîne introuvable. Vérifie le @handle, l\'URL ou l\'ID (UC...) de la chaîne.' });
        }
        channelId = resolved.id;
      }
    }
    if (!channelId) {
      const { data: chans } = await supabase
        .from('user_channels')
        .select('youtube_channel_id, is_primary')
        .eq('user_id', req.user.id);
      const primary = (chans || []).find(c => c.is_primary) || (chans || [])[0];
      channelId = primary?.youtube_channel_id;
    }
    if (!channelId) return res.status(400).json({ error: 'Entre l\'ID ou l\'URL de ta chaîne YouTube ci-dessus' });

    const audit = await getChannelAudit(channelId);
    if (!audit) return res.status(404).json({ error: 'Chaîne introuvable' });

    const health = computeHealthScore(audit);
    const recommendations = buildRecommendations(audit, health);

    res.json({ ...audit, health_score: health.score, health_breakdown: health.breakdown, recommendations });
  } catch (err) {
    console.error('[DIAMANT/AUDIT]', err.message);
    next(err);
  }
});

/* ── 💎 Vérification de position (rank) sur un mot-clé ── */
router.post('/rank-check', requireAuth, requireTier('diamant'), async (req, res, next) => {
  try {
    const { keyword, videoId } = req.body;
    if (!keyword || !videoId) return res.status(400).json({ error: 'keyword et videoId requis' });

    // On scanne les 50 premiers résultats pour trouver la vidéo
    const results = await searchVideos(keyword, 50);
    const idx = results.findIndex(v => v.videoId === videoId);

    res.json({
      keyword,
      videoId,
      rank: idx >= 0 ? idx + 1 : null,   // null = hors top 50
      found: idx >= 0,
      scanned: results.length,
      checked_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[DIAMANT/RANK]', err.message);
    next(err);
  }
});

/* ── 💎 Discover : top vidéos + stats pour un mot-clé ── */
router.post('/discover', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { keyword, sort = 'views', max = 20 } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword requis' });

    const videos = await searchVideos(keyword, Math.min(40, Math.max(5, +max || 20)));

    const sorters = {
      views:  (a, b) => b.views - a.views,
      likes:  (a, b) => (b.likes || 0) - (a.likes || 0),
      vph:    (a, b) => b.views_per_hour - a.views_per_hour,
      recent: (a, b) => new Date(b.published_at) - new Date(a.published_at)
    };
    videos.sort(sorters[sort] || sorters.views);

    res.json({ keyword, sort, count: videos.length, videos });
  } catch (err) {
    console.error('[DIAMANT/DISCOVER]', err.message);
    next(err);
  }
});

/* ── 💎 Analyze : analyse IA complète d'une vidéo ──────────────
   Va au-delà des chiffres visibles sur YouTube : score CTR du titre,
   titre amélioré, tags suggérés, verdict de performance, opportunités. */
router.post('/analyze', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const videoId = extractVideoId(req.body.videoId);
    const language = req.body.language || 'fr';
    if (!videoId) return res.status(400).json({ error: 'videoId requis' });
    const stats = await getVideoStats(videoId);
    if (!stats) return res.status(404).json({ error: 'Vidéo introuvable' });

    /* Analyses IA en parallèle (ce qu'on ne voit PAS sur YouTube) */
    const [titleAI, tagsAI, insights] = await Promise.all([
      titleDoctor(stats.title, language).catch(() => null),
      generateTags(stats.title, language).catch(() => null),
      generateCompetitorInsights(stats.title, language).catch(() => null)
    ]);

    /* Verdict de performance (calculé) : vues/heure rapportées à la taille de la chaîne */
    const subs = stats.channel_subs || 0;
    const vph = stats.views_per_hour || 0;
    const eng = stats.engagement_rate || 0;
    // ratio = part des abonnés touchée par heure (×100000 pour lisibilité)
    const reach = subs ? (vph / subs) * 100000 : 0;
    let perf, perfLabel;
    if (reach > 50 || (subs < 1000 && vph > 20)) { perf = 'excellent'; perfLabel = '🔥 Surperforme — au-dessus de sa taille de chaîne'; }
    else if (reach > 15) { perf = 'good'; perfLabel = '✅ Bonne performance pour la taille de la chaîne'; }
    else if (reach > 4)  { perf = 'average'; perfLabel = '➖ Performance moyenne'; }
    else { perf = 'low'; perfLabel = '⚠️ Sous-performe — peu de traction'; }

    const engVerdict = eng >= 5 ? 'Excellent engagement' : eng >= 2 ? 'Engagement correct' : 'Engagement faible';

    res.json({
      videoId, ...stats,
      analysis: {
        title: titleAI,                                  // { score, ctr_estimate, missing, improved, tips }
        suggested_tags: (tagsAI && tagsAI.tags) || [],   // tags que la vidéo DEVRAIT utiliser
        insights,                                        // { niche, opportunities, angles, keywords }
        performance: { label: perfLabel, level: perf, engagement_verdict: engVerdict }
      }
    });
  } catch (err) { console.error('[DIAMANT/ANALYZE]', err.message); next(err); }
});

/* ── 💎 Keyword Tool ── */
router.post('/keywords', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query requis' });
    const ideas = await getKeywordIdeas(query);
    res.json(ideas);
  } catch (err) { console.error('[DIAMANT/KW]', err.message); next(err); }
});

/* ── 💎 Trending : vidéos en hausse dans une niche ── */
router.post('/trending', requireAuth, requireTier('business'), async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query requis' });
    const videos = await getTrendingVideos(query, 12);
    res.json({ query, count: videos.length, videos });
  } catch (err) { console.error('[DIAMANT/TREND]', err.message); next(err); }
});

/* ── 💎 Analyse des commentaires (IA) ── */
router.post('/comments', requireAuth, requireTier('business'), async (req, res, next) => {
  try {
    const videoId = extractVideoId(req.body.videoId);
    const language = req.body.language || 'fr';
    if (!videoId) return res.status(400).json({ error: 'videoId requis' });
    const comments = await getVideoComments(videoId, 40);
    if (!comments.length) return res.json({ empty: true });
    let title = '';
    try { const s = await getVideoStats(videoId); title = s?.title || ''; } catch (e) {}
    const result = await analyzeComments(comments, title, language);
    result.count = comments.length;
    res.json(result);
  } catch (err) { console.error('[DIAMANT/COMMENTS]', err.message); next(err); }
});

/* ── 💎 Générer (IA) : titres + tags + description + hashtags depuis un sujet ── */
router.post('/generate', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { topic, language = 'fr' } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic requis' });
    const [titles, tags, desc] = await Promise.all([
      generateTitles(topic, language).catch(() => null),
      generateTags(topic, language).catch(() => null),
      generateDescription(topic, language).catch(() => null)
    ]);
    res.json({
      topic,
      titles: (titles && titles.titles) || [],
      tags: (tags && tags.tags) || [],
      description: (desc && desc.description) || '',
      hashtags: (desc && desc.hashtags) || []
    });
  } catch (err) { console.error('[DIAMANT/GENERATE]', err.message); next(err); }
});

/* ── 💎 A/B Test de titres (IA prédit le gagnant) ── */
router.post('/ab-titles', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { titleA, titleB, language = 'fr' } = req.body;
    if (!titleA || !titleB) return res.status(400).json({ error: 'titleA et titleB requis' });
    res.json(await compareTitles(titleA, titleB, language));
  } catch (err) { console.error('[DIAMANT/ABTITLES]', err.message); next(err); }
});

/* ── 💎 Idées de vidéos à fort potentiel ── */
router.post('/ideas', requireAuth, requireTier('pro'), async (req, res, next) => {
  try {
    const { niche = '', topic = '', language = 'fr' } = req.body;
    if (!niche && !topic) return res.status(400).json({ error: 'niche ou topic requis' });
    res.json(await generateVideoIdeas(niche, '', topic, language));
  } catch (err) { console.error('[DIAMANT/IDEAS]', err.message); next(err); }
});

/* ── 💎 Traduire / localiser les métadonnées (Languages) ── */
router.post('/translate', requireAuth, requireTier('business'), async (req, res, next) => {
  try {
    const { title = '', description = '', targetLang = 'en', language = 'fr' } = req.body;
    if (!title) return res.status(400).json({ error: 'title requis' });
    res.json(await translateMetadata(title, description, targetLang, language));
  } catch (err) { console.error('[DIAMANT/TRANSLATE]', err.message); next(err); }
});

module.exports = router;
