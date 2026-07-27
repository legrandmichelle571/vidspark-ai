/**
 * Routes PUBLIQUES (sans authentification) — outils SEO gratuits du site.
 * Sert de lead magnet : extracteur de tags / miniatures depuis une URL YouTube.
 */
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { getVideoStats, getVideoComments, getKeywordIdeas } = require('../utils/youtube');
const {
  generateTags, generateTitles, generateDescription,
  compareTitles, compareThumbnails, analyzeThumbnail,
  analyzeHook, generateShorts, generateVideoIdeas,
  optimizeAudience, estimateRevenue, analyzeComments,
  titleDoctor, supportChat
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
  validate: { trustProxy: false, xForwardedForHeader: false },
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

/* POST /api/public/ai/keyword-difficulty {query} → score de difficulté de ranking
   PUBLIC (lead magnet SEO, sans login) + rate-limité pour protéger le quota YouTube. */
router.post('/ai/keyword-difficulty', aiLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length < 2) return res.status(400).json({ error: 'Mot-clé requis (2 caractères min)' });
    const ideas = await getKeywordIdeas(query.trim().slice(0, 100));
    res.json(ideas);
  } catch (err) {
    console.error('[PUBLIC/KW-DIFF]', err.message);
    res.status(500).json({ error: 'Service indisponible' });
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

/* POST /api/public/ai/viral-score → titleDoctor, normalisé pour le frontend */
router.post('/ai/viral-score', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { title, language = 'fr' } = req.body;
    if (!title || title.trim().length < 3) return res.status(400).json({ error: 'Titre requis' });
    const r = await titleDoctor(title.trim(), language);
    const score = +r.score || 0;
    const factors = []
      .concat((r.tips || []).map(t => ({ label: 'Conseil', ok: true, comment: t })))
      .concat((r.missing || []).map(m => ({ label: 'À améliorer', ok: false, comment: m })));
    res.json({
      current_score: score,
      potential_score: Math.min(100, score + 15),
      factors,
      suggestion: r.improved || null
    });
  } catch (err) {
    console.error('[PUBLIC/VIRAL-SCORE]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/ab-test-titles → compareTitles, normalisé */
router.post('/ai/ab-test-titles', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { title_a, title_b, language = 'fr' } = req.body;
    if (!title_a || !title_b) return res.status(400).json({ error: 'Les deux titres sont requis' });
    const r = await compareTitles(title_a.trim(), title_b.trim(), language);
    res.json({
      winner: r.winner || 'A',
      ctr_a: r.a?.ctr_estimate ?? '—',
      ctr_b: r.b?.ctr_estimate ?? '—',
      analysis: r.verdict || '',
      improved: r.improved || null
    });
  } catch (err) {
    console.error('[PUBLIC/AB-TITLES]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/ab-test-thumbnails → compareThumbnails, normalisé */
router.post('/ai/ab-test-thumbnails', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { image_a, image_b, language = 'fr' } = req.body;
    if (!image_a || !image_b) return res.status(400).json({ error: 'Les deux images sont requises' });
    const r = await compareThumbnails(image_a, image_b, language);
    const w = r.winner || 'A';
    res.json({
      winner: w,
      ctr_winner: (w === 'A' ? r.a?.ctr_estimate : r.b?.ctr_estimate) ?? '—',
      analysis: r.verdict || '',
      improvement: (r.tips && r.tips[0]) || null
    });
  } catch (err) {
    console.error('[PUBLIC/AB-THUMBS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/thumbnail-analyzer → analyzeThumbnail, normalisé */
router.post('/ai/thumbnail-analyzer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { image_base64, language = 'fr' } = req.body;
    if (!image_base64) return res.status(400).json({ error: 'Image requise' });
    const r = await analyzeThumbnail(image_base64, '', language);
    const score = +r.score || 0;
    res.json({
      score,
      ctr_estimate: Math.round((2 + score / 100 * 8) * 10) / 10,
      face_score: r.has_face ? 85 : 30,
      text_score: r.has_text ? 80 : 40,
      tips: (r.tips || []).concat(r.strengths ? [] : []),
    });
  } catch (err) {
    console.error('[PUBLIC/THUMBNAIL]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/hook-analyzer → analyzeHook, normalisé */
router.post('/ai/hook-analyzer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { hook, language = 'fr' } = req.body;
    if (!hook || hook.trim().length < 20) return res.status(400).json({ error: 'Intro trop courte (20 caractères min)' });
    const r = await analyzeHook(hook.trim(), language);
    const dp = (r.drop_points && r.drop_points[0]) || null;
    res.json({
      retention_score: +r.retention_estimate || +r.hook_score || 0,
      dropout_moment: dp ? `"${dp.quote}" — ${dp.reason}` : null,
      issues: r.fixes || [],
      strengths: r.strengths || [],
      rewritten_hook: r.rewritten_hook || null
    });
  } catch (err) {
    console.error('[PUBLIC/HOOK]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/shorts-generator → generateShorts, normalisé */
router.post('/ai/shorts-generator', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { topic, language = 'fr' } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: 'Sujet requis' });
    const r = await generateShorts(topic.trim(), language);
    const shorts = (r.shorts || []).map(s => {
      const c = (s.clips && s.clips[0]) || null;
      return {
        title: s.title || '',
        hook: s.hook || '',
        script: Array.isArray(s.script) ? s.script.join(' • ') : (s.script || ''),
        timestamp: c ? `${c.start_sec}s → ${c.end_sec}s${s.estimated ? ' (estimé)' : ''}` : (s.duration || ''),
        hashtags: Array.isArray(s.hashtags) ? s.hashtags.join(' ') : (s.hashtags || '')
      };
    });
    res.json({ shorts });
  } catch (err) {
    console.error('[PUBLIC/SHORTS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/video-ideas → generateVideoIdeas (déjà compatible) */
router.post('/ai/video-ideas', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { niche, topic = '', language = 'fr' } = req.body;
    if (!niche || niche.trim().length < 2) return res.status(400).json({ error: 'Niche requise' });
    res.json(await generateVideoIdeas(niche.trim(), '', topic.trim(), language));
  } catch (err) {
    console.error('[PUBLIC/IDEAS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/audience-optimizer → optimizeAudience, normalisé */
router.post('/ai/audience-optimizer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { niche, region = 'FR', language = 'fr' } = req.body;
    if (!niche || niche.trim().length < 2) return res.status(400).json({ error: 'Niche requise' });
    const r = await optimizeAudience(region, language, language, niche.trim());
    const bt = r.best_times || [];
    res.json({
      best_hours: bt.length ? bt.map(t => t.time).filter(Boolean).join(', ') : null,
      best_days: bt.length ? [...new Set(bt.map(t => t.day).filter(Boolean))].join(', ') : null,
      trends: r.trends || [],
      topics: r.topic_ideas || [],
      hashtags: Array.isArray(r.hashtags) ? r.hashtags.join(' ') : (r.hashtags || ''),
      tip: (r.tips && r.tips[0]) || null
    });
  } catch (err) {
    console.error('[PUBLIC/AUDIENCE]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/revenue-estimator → estimateRevenue, normalisé */
router.post('/ai/revenue-estimator', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { niche, subscribers = 0, country = 'FR', language = 'fr' } = req.body;
    if (!niche || niche.trim().length < 2) return res.status(400).json({ error: 'Niche requise' });
    const r = await estimateRevenue(niche.trim(), niche.trim(), country, subscribers, language);
    res.json({
      views_7d: r.views_7d?.expected || r.views_7d?.low || 0,
      revenue_min: Math.round(r.revenue_usd?.low || 0),
      revenue_max: Math.round(r.revenue_usd?.high || 0),
      rpm: r.rpm_usd ?? '—',
      analysis: (r.factors || []).join(' '),
      tips: r.tips || []
    });
  } catch (err) {
    console.error('[PUBLIC/REVENUE]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* POST /api/public/ai/comment-analyzer → analyzeComments, normalisé */
router.post('/ai/comment-analyzer', requireAuth, requireProPlan, aiLimiter, async (req, res) => {
  try {
    const { video_url, language = 'fr' } = req.body;
    if (!video_url) return res.status(400).json({ error: 'URL de vidéo requise' });
    const m = String(video_url).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
    if (!m) return res.status(400).json({ error: 'URL YouTube invalide' });
    let comments = [];
    try { comments = await getVideoComments(m[1], 40); } catch (e) { /* clé API optionnelle */ }
    if (!comments.length) return res.json({ empty: true, sentiment: 'neutre', positive_pct: 0, negative_pct: 0 });
    const r = await analyzeComments(comments, '', language);
    const s = r.sentiment || {};
    const pos = +s.positive || 0, neg = +s.negative || 0;
    res.json({
      sentiment: pos > neg ? 'positif' : neg > pos ? 'négatif' : 'neutre',
      positive_pct: pos,
      negative_pct: neg,
      audience_requests: r.requests || [],
      video_ideas: r.video_ideas || [],
      top_comment: r.summary || null
    });
  } catch (err) {
    console.error('[PUBLIC/COMMENTS]', err.message);
    res.status(500).json({ error: err.message || 'Génération indisponible' });
  }
});

/* Anti-abus du widget de chat public : 20 messages / heure / IP — assez pour
   une vraie conversation, assez peu pour limiter le coût d'un endpoint sans
   authentification (voir js/support-chat.js pour le widget correspondant). */
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { error: 'Trop de messages, réessaie dans un moment.', code: 'RATE_LIMIT' }
});

/* POST /api/public/ai/chat {message, history[], language} → widget de chat IA
   public (bulle flottante sur le site). Aucune authentification requise. */
router.post('/ai/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history, language = 'fr' } = req.body || {};
    if (!message || String(message).trim().length < 1) return res.status(400).json({ error: 'Message requis' });
    if (String(message).length > 800) return res.status(400).json({ error: 'Message trop long (800 caractères max)' });

    const safeHistory = Array.isArray(history)
      ? history.slice(-6)
          .filter(h => h && h.role && h.content)
          .map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content).slice(0, 500) }))
      : [];

    const r = await supportChat(String(message).trim().slice(0, 800), safeHistory, language);
    res.json({ reply: r.reply || '' });
  } catch (err) {
    console.error('[PUBLIC/CHAT]', err.message);
    res.status(500).json({ error: 'Assistant indisponible pour le moment.' });
  }
});

/* ── Pubs du site (publiques) — affichées sur l'accueil et le dashboard ── */
router.get('/ads', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const keys = ['ad_home', 'ad_home_left', 'ad_home_right', 'ad_dashboard', 'ad_dashboard_right', 'promo_video'];
    const { data } = await supabase.from('site_config').select('key,value').in('key', keys);
    const out = {};
    (data || []).forEach(r => { out[r.key] = r.value; });
    res.json({
      home: out.ad_home || '', home_left: out.ad_home_left || '', home_right: out.ad_home_right || '',
      dashboard: out.ad_dashboard || '', dashboard_right: out.ad_dashboard_right || '',
      promo_video: out.promo_video || ''
    });
  } catch (e) {
    res.json({ home: '', dashboard: '' });
  }
});

/* Anti-spam : 5 messages / heure / IP */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { error: 'Trop de messages envoyés, réessaie dans une heure.', code: 'RATE_LIMIT' }
});

/* POST /api/public/contact → reçoit le formulaire de contact du site.
   Envoie un email via Resend si RESEND_API_KEY est configurée, et
   stocke le message dans Supabase (best-effort). Si aucun canal n'est
   configuré, renvoie 503 EMAIL_NOT_CONFIGURED → le front bascule sur mailto. */
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { nom, email, sujet, plan, message, rgpd } = req.body || {};

    /* Validation */
    if (!nom || String(nom).trim().length < 2)        return res.status(400).json({ error: 'Nom requis' });
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) return res.status(400).json({ error: 'Email invalide' });
    if (!message || String(message).trim().length < 20) return res.status(400).json({ error: 'Message trop court (20 caractères min)' });
    if (rgpd !== true && rgpd !== 'true' && rgpd !== 'on') return res.status(400).json({ error: 'Consentement RGPD requis' });

    const clean = s => String(s || '').slice(0, 5000).replace(/[<>]/g, '');
    const payload = {
      nom: clean(nom), email: clean(email), sujet: clean(sujet),
      plan: clean(plan), message: clean(message)
    };

    let sent = false, stored = false;

    /* 1) Envoi email via Resend (si configuré) */
    const resendKey = process.env.RESEND_API_KEY;
    /* CONTACT_TO peut contenir plusieurs adresses séparées par des virgules */
    const to = (process.env.CONTACT_TO || 'contact@vidsparkpro.com,support@vidsparkpro.com')
      .split(',').map(s => s.trim()).filter(Boolean);
    const from = process.env.CONTACT_FROM || 'VidSpark AI <onboarding@resend.dev>';
    if (resendKey) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from, to, reply_to: payload.email,
            subject: `[Contact] ${payload.sujet || 'Nouveau message'} — ${payload.nom}`,
            text:
`Nom    : ${payload.nom}
Email  : ${payload.email}
Sujet  : ${payload.sujet}
Plan   : ${payload.plan}

${payload.message}`
          })
        });
        sent = r.ok;
        if (!r.ok) console.error('[CONTACT/RESEND]', await r.text());
      } catch (e) { console.error('[CONTACT/RESEND]', e.message); }
    }

    /* 2) Stockage Supabase (best-effort, n'échoue pas la requête) */
    try {
      const supabase = req.app.locals.supabase;
      const { error } = await supabase.from('contact_messages').insert({
        name: payload.nom, email: payload.email, subject: payload.sujet,
        plan: payload.plan, message: payload.message
      });
      stored = !error;
      if (error) console.error('[CONTACT/STORE]', error.message);
    } catch (e) { console.error('[CONTACT/STORE]', e.message); }

    if (!sent && !stored) {
      return res.status(503).json({ error: 'Email non configuré', code: 'EMAIL_NOT_CONFIGURED' });
    }
    res.json({ ok: true, sent, stored });
  } catch (err) {
    console.error('[CONTACT]', err.message);
    res.status(500).json({ error: 'Envoi impossible' });
  }
});

module.exports = router;
