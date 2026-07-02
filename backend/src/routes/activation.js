/**
 * Routes d'activation de l'extension Chrome
 * POST /api/activation/activate          → valider ID + Secret (renvoie la chaîne verrouillée)
 * POST /api/activation/bind-channel      → verrouiller UNE chaîne sur ce code (1 ID = 1 chaîne)
 * GET  /api/activation/remaining/:id     → vérifier la durée restante
 *
 * Les codes sont stockés dans la table `activation_codes`
 * (générés par POST /api/auth/google lors de la connexion au dashboard).
 * La chaîne verrouillée est stockée dans activation_codes.channel_id / channel_name.
 */
const router = require('express').Router();
const { getChannelLimit } = require('../config/channelLimits');

/* Récupère un code d'activation valide (ID + Secret) ou null */
async function findValidCode(supabase, activation_id, activation_secret) {
  const { data: code } = await supabase
    .from('activation_codes')
    .select('*')                 // select('*') : résilient si la colonne channel_id n'existe pas encore
    .eq('activation_id', activation_id)
    .eq('activation_secret', activation_secret)
    .maybeSingle();
  return code || null;
}

/* ── Valider ID + Secret (appelé par l'extension) ── */
router.post('/activate', async (req, res) => {
  try {
    const { activation_id, activation_secret, device_id } = req.body;
    if (!activation_id || !activation_secret) {
      return res.status(400).json({ error: 'ID et Secret requis' });
    }

    const supabase = req.app.locals.supabase;
    const code = await findValidCode(supabase, activation_id, activation_secret);
    if (!code) {
      return res.status(401).json({ error: 'ID ou Secret invalide' });
    }

    const expiryDate = new Date(code.subscription_expiry);
    const now = new Date();
    if (expiryDate < now) {
      return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, plan, status')
      .eq('id', code.user_id)
      .maybeSingle();

    // Compte supprimé ou suspendu par l'admin → activation refusée
    if (!user || user.status === 'suspended') {
      return res.status(403).json({ error: 'Compte suspendu — contacte le support.', suspended: true });
    }

    // 🔒 Verrouillage par appareil — 1 code marche sur N PC selon le plan
    //    (Free/Pro = 1 · Business = 5 · Diamant = 10). Table activation_devices.
    if (device_id) {
      const maxDevices = getChannelLimit(user?.plan);

      // Cet appareil est-il déjà lié à ce code ?
      const { data: existingDev } = await supabase
        .from('activation_devices')
        .select('device_id')
        .eq('activation_id', activation_id)
        .eq('device_id', device_id)
        .maybeSingle();

      if (!existingDev) {
        // Compter les appareils déjà liés
        const { count } = await supabase
          .from('activation_devices')
          .select('device_id', { count: 'exact', head: true })
          .eq('activation_id', activation_id);

        if ((count || 0) >= maxDevices) {
          return res.status(403).json({
            error: maxDevices === 1
              ? 'Ce code est déjà utilisé sur un autre appareil. Libère-le (bouton 🔑) ou via le dashboard.'
              : `Limite de ${maxDevices} appareils atteinte pour ce code. Libère un appareil (bouton 🔑) ou via le dashboard.`,
            code: 'DEVICE_LOCKED'
          });
        }

        // Lier ce nouvel appareil
        await supabase.from('activation_devices').insert({
          activation_id, device_id, user_id: code.user_id
        });
      }
      // sinon (déjà lié) → OK
    }

    // Liste des chaînes autorisées (multi-chaînes selon le plan)
    const { data: chans } = await supabase
      .from('activation_channels')
      .select('channel_id, channel_name')
      .eq('user_id', code.user_id);
    const channels = chans || [];

    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      user: {
        id:    user?.id,
        email: user?.email,
        name:  user?.name,
        plan:  user?.plan || 'free'
      },
      subscription: {
        expiry:         code.subscription_expiry,
        days_remaining: Math.max(0, daysRemaining),
        is_active:      true
      },
      // Chaînes autorisées + limite du plan
      channels,
      channel_ids:   channels.map(c => c.channel_id),
      channel_limit: getChannelLimit(user?.plan)
    });
  } catch (err) {
    console.error('[ACTIVATION]', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'activation' });
  }
});

/* ── Libérer le code de cet appareil (pour le réutiliser ailleurs) ── */
router.post('/release', async (req, res) => {
  try {
    const { activation_id, activation_secret, device_id } = req.body;
    if (!activation_id || !activation_secret) {
      return res.status(400).json({ error: 'ID et Secret requis' });
    }
    const supabase = req.app.locals.supabase;
    const code = await findValidCode(supabase, activation_id, activation_secret);
    if (!code) return res.status(401).json({ error: 'ID ou Secret invalide' });

    // Libérer cet appareil (ou tous si device_id absent)
    let q = supabase.from('activation_devices').delete().eq('activation_id', activation_id);
    if (device_id) q = q.eq('device_id', device_id);
    await q;

    res.json({ success: true, released: true });
  } catch (err) {
    console.error('[RELEASE]', err.message);
    res.status(500).json({ error: 'Erreur lors de la libération' });
  }
});

/* ── Verrouiller UNE chaîne sur ce code (1 ID = 1 chaîne) ── */
router.post('/bind-channel', async (req, res) => {
  try {
    const { activation_id, activation_secret, channel_id, channel_name } = req.body;
    if (!activation_id || !activation_secret || !channel_id) {
      return res.status(400).json({ error: 'ID, Secret et channel_id requis' });
    }

    const supabase = req.app.locals.supabase;
    const code = await findValidCode(supabase, activation_id, activation_secret);
    if (!code) {
      return res.status(401).json({ error: 'ID ou Secret invalide' });
    }

    // (Re)lier la chaîne — 1 ID = 1 chaîne ACTIVE à la fois, mais corrigible
    // (la nouvelle chaîne remplace l'ancienne ; évite un verrou définitif sur une mauvaise chaîne).
    const { error: upErr } = await supabase
      .from('activation_codes')
      .update({ channel_id, channel_name: channel_name || channel_id })
      .eq('activation_id', activation_id);

    if (upErr) {
      console.error('[BIND-CHANNEL] update error:', upErr.message);
      return res.status(500).json({ error: 'Impossible de verrouiller la chaîne' });
    }

    res.json({ success: true, locked: true, channel_id, channel_name: channel_name || channel_id });
  } catch (err) {
    console.error('[BIND-CHANNEL]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ── Vérifier la durée restante (appelé par l'extension) ── */
router.get('/remaining/:activation_id', async (req, res) => {
  try {
    const { activation_id } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: code, error } = await supabase
      .from('activation_codes')
      .select('subscription_expiry')
      .eq('activation_id', activation_id)
      .maybeSingle();

    if (error || !code) {
      return res.status(404).json({ error: 'ID non trouvé' });
    }

    const expiryDate = new Date(code.subscription_expiry);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      expiry:         code.subscription_expiry,
      days_remaining: Math.max(0, daysRemaining),
      is_active:      expiryDate > now
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ════════════════════════════════════════════════════════════════
   IA via code d'activation (l'extension n'a pas de JWT)
   Gating par plan : Titres IA / Rapport IA / Concurrence = Pro & Business.
   ════════════════════════════════════════════════════════════════ */
const { generateTitles, generateReport, generateCompetitorInsights } = require('../utils/aiClient');
const { logConnection } = require('../utils/connectionLog');

/* Valide le code + récupère le plan de l'utilisateur. Renvoie {code,user} ou null. */
/* heartbeat "en ligne" + stats connexion IP (extension). Throttlé et non bloquant
   dans connectionLog.js ; écrit last_active/last_active_src/last_ip + connection_logs
   (résilient si migration 019 pas encore exécutée). */
async function getCodeUser(supabase, activation_id, activation_secret, req) {
  const code = await findValidCode(supabase, activation_id, activation_secret);
  if (!code) return null;
  if (new Date(code.subscription_expiry) < new Date()) return { expired: true };
  const { data: user } = await supabase
    .from('users').select('id, plan, status').eq('id', code.user_id).maybeSingle();
  // Compte supprimé ou suspendu → on verrouille (même traitement que "expiré")
  if (!user || user.status === 'suspended') return { expired: true, suspended: true };
  if (req) logConnection(supabase, user.id, 'ext', req);
  return { code, user, plan: (user.plan || 'free') };
}

/* Middleware-like : exige un plan payant (pro/business/diamant) */
function requirePaidPlan(plan) {
  return ['pro', 'business', 'diamant'].includes((plan || '').toLowerCase());
}

/* ── Titres IA (Pro/Business) ── */
router.post('/ai/titles', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)         return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired)  return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    const result = await generateTitles(title, language);

    // FREE = aperçu : 1 vrai titre visible, le reste verrouillé (hook de conversion)
    if (!requirePaidPlan(ctx.plan)) {
      const all = result.titles || [];
      return res.json({ titles: all.slice(0, 1), preview: true, locked: Math.max(0, all.length - 1) });
    }

    res.json(result);
  } catch (err) {
    console.error('[ACT-AI/TITLES]', err.message);
    res.status(500).json({ error: 'Génération des titres échouée', details: err.message });
  }
});

/* ── Rapport IA complet (Pro/Business) ── */
router.post('/ai/report', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, description = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    const result = await generateReport(title, description, language);

    // FREE = aperçu : score + 1 insight IA visibles, checklist/suggestions verrouillées
    if (!requirePaidPlan(ctx.plan)) {
      return res.json({
        score: result.score,
        viral_score: result.viral_score,
        viral_reason: result.viral_reason,
        checklist: [],
        suggestions: [],
        preview: true
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[ACT-AI/REPORT]', err.message);
    res.status(500).json({ error: 'Génération du rapport échouée' });
  }
});

/* ── Description IA (Pro/Business) ── */
router.post('/ai/description', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !title) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Description IA réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    res.json(await generateDescription(title, language));
  } catch (err) {
    console.error('[ACT-AI/DESC]', err.message);
    res.status(500).json({ error: 'Génération de description échouée', details: err.message });
  }
});

/* ── Tags IA (Pro/Business) ── */
router.post('/ai/tags', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !title) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Tags IA réservés aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    res.json(await generateTags(title, language));
  } catch (err) {
    console.error('[ACT-AI/TAGS]', err.message);
    res.status(500).json({ error: 'Génération de tags échouée', details: err.message });
  }
});

/* ── Analyse concurrentielle IA (Pro/Business) ── */
router.post('/ai/competitor', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Analyse concurrents réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await generateCompetitorInsights(title, language);
    res.json(result);
  } catch (err) {
    console.error('[ACT-AI/COMPETITOR]', err.message);
    res.status(500).json({ error: 'Analyse concurrentielle échouée' });
  }
});

/* ── Vraies données YouTube (API v3) — Pro/Business ── */
const { getVideoStats, searchVideos, getChannelAudit, getKeywordIdeas, getTranscript, iso8601ToSeconds, secToTimestamp, getVideoComments, getChannelVideos, getTrendingVideos } = require('../utils/youtube');
const { analyzeThumbnail, generateThumbnailImage, thumbnailIdeas, generateDescription, generateTags, compareTitles, generateShorts, compareThumbnails, analyzeHook, optimizeAudience, generateVideoPackage, estimateRevenue, generateChannelReport, analyzeComments, generateChapters, generateVideoIdeas, keywordOpportunity, titleDoctor, sponsorKit, generateContentPlan, translateMetadata, generateCommunityPosts, generateScript, pairCheck, optimizePlaylists, detectTrends } = require('../utils/aiClient');
const { getThumbnailLimit } = require('../config/thumbnailLimits');

router.post('/youtube/video', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId } = req.body;
    if (!activation_id || !activation_secret || !videoId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Données YouTube réelles réservées aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    const data = await getVideoStats(videoId);
    if (!data) return res.status(404).json({ error: 'Vidéo introuvable' });
    res.json(data);
  } catch (err) {
    console.error('[YT/VIDEO]', err.message);
    res.status(500).json({ error: 'Données YouTube indisponibles', details: err.message });
  }
});

router.post('/youtube/competitors', async (req, res) => {
  try {
    const { activation_id, activation_secret, query } = req.body;
    if (!activation_id || !activation_secret || !query) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Analyse concurrents réelle réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    const videos = await searchVideos(query, 8);
    res.json({ videos });
  } catch (err) {
    console.error('[YT/COMP]', err.message);
    res.status(500).json({ error: 'Recherche indisponible', details: err.message });
  }
});

/* ── Audit de chaîne (Pro/Business) ── */
router.post('/youtube/channel-audit', async (req, res) => {
  try {
    const { activation_id, activation_secret, channelId } = req.body;
    if (!activation_id || !activation_secret || !channelId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Audit de chaîne réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    const audit = await getChannelAudit(channelId);
    if (!audit) return res.status(404).json({ error: 'Chaîne introuvable' });
    res.json(audit);
  } catch (err) {
    console.error('[YT/AUDIT]', err.message);
    res.status(500).json({ error: 'Audit indisponible', details: err.message });
  }
});

/* ── Recherche de mots-clés (Pro/Business) ── */
router.post('/youtube/keywords', async (req, res) => {
  try {
    const { activation_id, activation_secret, query } = req.body;
    if (!activation_id || !activation_secret || !query) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Recherche de mots-clés réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    const { language = 'fr', opportunity: wantOpp } = req.body;
    const ideas = await getKeywordIdeas(query);

    // Score d'opportunité IA (optionnel — demandé explicitement par l'extension)
    if (wantOpp) {
      try { ideas.opportunity = await keywordOpportunity(query, ideas, language); }
      catch (e) { /* non bloquant */ }
    }
    res.json(ideas);
  } catch (err) {
    console.error('[YT/KW]', err.message);
    res.status(500).json({ error: 'Recherche indisponible', details: err.message });
  }
});

/* ── Analyse de miniature par IA (Pro/Business) ── */
router.post('/ai/thumbnail', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId, title = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !videoId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Analyse de miniature réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    // Récupérer l'image de la miniature et la convertir en base64
    let b64 = null;
    for (const q of ['maxresdefault', 'hqdefault', 'mqdefault']) {
      try {
        const ir = await fetch(`https://i.ytimg.com/vi/${videoId}/${q}.jpg`);
        if (ir.ok) { const buf = Buffer.from(await ir.arrayBuffer()); if (buf.length > 1000) { b64 = buf.toString('base64'); break; } }
      } catch (e) {}
    }
    if (!b64) return res.status(404).json({ error: 'Miniature introuvable' });

    const result = await analyzeThumbnail(b64, title, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/THUMB]', err.message);
    res.status(500).json({ error: 'Analyse de miniature indisponible', details: err.message });
  }
});

/* ── Génération de miniature (Pro=30/mois, Business=50/mois, Free=bloqué) ── */
router.post('/ai/thumbnail-generate', async (req, res) => {
  try {
    const { activation_id, activation_secret, title = '', prompt = '', no_text = false } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });

    const limit = getThumbnailLimit(ctx.plan);
    if (limit === 0) {
      return res.status(403).json({ error: 'Génération de miniatures réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    // Quota mensuel
    const month = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('thumbnail_usage').select('count').eq('user_id', ctx.user.id).eq('month', month).maybeSingle();
    const used = usage?.count || 0;
    if (used >= limit) {
      return res.status(429).json({ error: `Quota mensuel atteint (${used}/${limit} miniatures).`, code: 'QUOTA_REACHED', used, limit });
    }

    // no_text = fond seul SANS texte (l'IA d'image ne sait pas écrire, surtout en arabe/RTL → le texte est superposé côté client)
    const fullPrompt = no_text
      ? `YouTube thumbnail BACKGROUND, 16:9, ultra eye-catching, vivid colors, high contrast, cinematic, dramatic lighting. ${prompt}. IMPORTANT: absolutely NO text, NO letters, NO words, NO writing, NO captions, NO logos — clean image only, leave empty space for a text overlay.`.trim()
      : `YouTube thumbnail, 16:9, ultra eye-catching, vivid colors, high contrast, bold readable text, cinematic, for a video titled "${title}". ${prompt}`.trim();
    const img = await generateThumbnailImage(fullPrompt);

    // Incrémenter le quota
    await supabase.from('thumbnail_usage').upsert(
      { user_id: ctx.user.id, month, count: used + 1 },
      { onConflict: 'user_id,month' }
    );

    res.json({ image: img.base64, mime: img.mime, used: used + 1, limit });
  } catch (err) {
    console.error('[AI/THUMB-GEN]', err.message);
    res.status(500).json({ error: 'Génération de miniature indisponible', details: err.message });
  }
});

/* ── Concepts de miniature IA — brief texte (Pro/Business ; Free = 1 aperçu) ── */
router.post('/ai/thumbnail-ideas', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, niche = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });

    const result = await thumbnailIdeas(title, niche, language);

    // FREE = aperçu : 1 concept visible, les autres verrouillés (hook de conversion)
    if (!requirePaidPlan(ctx.plan)) {
      const all = result.concepts || [];
      return res.json({ concepts: all.slice(0, 1), preview: true, locked: Math.max(0, all.length - 1) });
    }

    res.json(result);
  } catch (err) {
    console.error('[AI/THUMB-IDEAS]', err.message);
    res.status(500).json({ error: 'Génération des concepts de miniature indisponible', details: err.message });
  }
});

/* ── A/B Test IA : prédit le titre gagnant (Pro/Business) ── */
router.post('/ai/ab-test', async (req, res) => {
  try {
    const { activation_id, activation_secret, titleA, titleB, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!titleA || !titleB) return res.status(400).json({ error: 'Deux titres requis (titleA et titleB)' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'A/B Testing réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await compareTitles(titleA, titleB, language);

    // Sauvegarder le test (Phase 2 : suivi dans le temps)
    try {
      await supabase.from('ab_tests').insert({
        user_id:   ctx.user.id,
        variant_a: titleA,
        variant_b: titleB,
        winner:    result.winner || null,
        ctr_a:     result.a?.ctr_estimate || null,
        ctr_b:     result.b?.ctr_estimate || null,
        status:    'predicted'
      });
    } catch (e) { /* table optionnelle, non bloquant */ }

    res.json(result);
  } catch (err) {
    console.error('[AI/AB-TEST]', err.message);
    res.status(500).json({ error: 'A/B Test indisponible', details: err.message });
  }
});

/* ── Historique des A/B Tests (Pro/Business) ── */
router.post('/ai/ab-test/history', async (req, res) => {
  try {
    const { activation_id, activation_secret } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    const { data } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json({ tests: data || [] });
  } catch (err) {
    console.error('[AI/AB-HISTORY]', err.message);
    res.status(500).json({ error: 'Historique indisponible', details: err.message });
  }
});

/* ── Générateur de Shorts IA (Pro/Business, Free = 1 aperçu) ── */
router.post('/ai/shorts', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId, title, description = '', language = 'fr', transcript: clientTranscript = '' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });

    const source = description ? `${title} — ${description.slice(0, 300)}` : title;

    // Transcription : priorité à celle envoyée par l'extension (cookies/session de la page),
    // sinon tentative serveur (souvent bloquée), sinon repli sur timestamps estimés.
    let opts = { hasTranscript: false, transcript: '', durationStr: '' };
    if (clientTranscript && clientTranscript.trim().length > 30) {
      opts.transcript = clientTranscript.slice(0, 3500);
      opts.hasTranscript = true;
    }
    if (videoId) {
      try {
        const stats = await getVideoStats(videoId).catch(() => null);
        if (stats?.duration) opts.durationStr = secToTimestamp(iso8601ToSeconds(stats.duration));
        if (!opts.hasTranscript) {
          const tr = await getTranscript(videoId);
          if (tr.available && tr.segments.length) {
            let lastStart = -100, lines = [];
            for (const s of tr.segments) {
              if (s.start - lastStart >= 12) { lines.push(`[${secToTimestamp(s.start)}] ${s.text}`); lastStart = s.start; }
              else if (lines.length) lines[lines.length - 1] += ' ' + s.text;
            }
            let t = lines.join('\n');
            if (t.length > 3500) t = t.slice(0, 3500) + '…';
            opts.transcript = t;
            opts.hasTranscript = true;
          }
        }
      } catch (e) { /* transcription optionnelle */ }
    }

    // Tentative avec transcription ; si l'IA échoue (JSON tronqué/invalide), repli sans transcription
    let result;
    try {
      result = await generateShorts(source, language, opts);
    } catch (e1) {
      console.error('[AI/SHORTS] 1st attempt failed, retrying without transcript:', e1.message);
      result = await generateShorts(source, language, { hasTranscript: false, transcript: '', durationStr: opts.durationStr });
    }

    // Ajouter les timestamps formatés (M:SS) à chaque passage
    (result.shorts || []).forEach(sh => {
      (sh.clips || []).forEach(c => {
        c.start = secToTimestamp(c.start_sec || 0);
        c.end   = secToTimestamp(c.end_sec || 0);
      });
    });
    result.transcript_used = opts.hasTranscript;

    // FREE = aperçu : 1 seul Short visible, le reste verrouillé
    if (!requirePaidPlan(ctx.plan)) {
      const all = result.shorts || [];
      return res.json({ shorts: all.slice(0, 1), preview: true, locked: Math.max(0, all.length - 1), transcript_used: opts.hasTranscript });
    }

    res.json(result);
  } catch (err) {
    console.error('[AI/SHORTS]', err.message);
    res.status(500).json({ error: 'Génération de Shorts indisponible', details: err.message });
  }
});

/* ── A/B Test de miniatures par IA Vision (Pro/Business) ── */
router.post('/ai/thumbnail-ab', async (req, res) => {
  try {
    const { activation_id, activation_secret, imageA, imageB, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!imageA || !imageB) return res.status(400).json({ error: 'Deux images requises (imageA et imageB en base64)' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'A/B Test de miniatures réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    // Nettoyer un éventuel préfixe data URL
    const clean = s => (s || '').replace(/^data:image\/\w+;base64,/, '');
    const result = await compareThumbnails(clean(imageA), clean(imageB), language);
    res.json(result);
  } catch (err) {
    console.error('[AI/THUMB-AB]', err.message);
    res.status(500).json({ error: 'A/B Test de miniatures indisponible', details: err.message });
  }
});

/* ── Hook Analyzer : prédit la rétention de l'intro (Pro/Business) ── */
router.post('/ai/hook', async (req, res) => {
  try {
    const { activation_id, activation_secret, script, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!script || script.trim().length < 10) return res.status(400).json({ error: 'Script d\'intro requis (10 caractères min)' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Hook Analyzer réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await analyzeHook(script, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/HOOK]', err.message);
    res.status(500).json({ error: 'Hook Analyzer indisponible', details: err.message });
  }
});

/* ── Optimiseur d'audience (région/pays + langue) — Pro/Business ── */
router.post('/ai/audience', async (req, res) => {
  try {
    const { activation_id, activation_secret, target = '', content_language = 'fr', language = 'fr', niche = '' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Optimiseur d\'audience réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await optimizeAudience(target, content_language, language, niche);
    res.json(result);
  } catch (err) {
    console.error('[AI/AUDIENCE]', err.message);
    res.status(500).json({ error: 'Optimiseur d\'audience indisponible', details: err.message });
  }
});

/* ── Pack vidéo complet : description + hashtags + tags (Pro/Business) ── */
router.post('/ai/video-package', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, niche = '', region = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Description complète réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await generateVideoPackage(title, niche, region, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/VIDEO-PACKAGE]', err.message);
    res.status(500).json({ error: 'Génération de la description indisponible', details: err.message });
  }
});

/* ── Estimateur de vues + revenus (Pro/Business) ── */
router.post('/ai/revenue', async (req, res) => {
  try {
    const { activation_id, activation_secret, title = '', niche = '', region = '', subscribers = 0, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Estimateur de revenus réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await estimateRevenue(title, niche, region, subscribers, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/REVENUE]', err.message);
    res.status(500).json({ error: 'Estimateur indisponible', details: err.message });
  }
});

/* ── Rapport de santé de chaîne (IA) — Pro/Business ── */
router.post('/ai/channel-report', async (req, res) => {
  try {
    const { activation_id, activation_secret, stats = {}, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Rapport de chaîne réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await generateChannelReport(stats, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/CHANNEL-REPORT]', err.message);
    res.status(500).json({ error: 'Rapport de chaîne indisponible', details: err.message });
  }
});

/* ── Analyse des commentaires (Pro/Business) ── */
router.post('/ai/comments', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId, title = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !videoId) return res.status(400).json({ error: 'Paramètres requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Analyse des commentaires réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const comments = await getVideoComments(videoId, 40);
    if (!comments.length) return res.json({ empty: true, sentiment: {}, summary: '', themes: [], requests: [], video_ideas: [], suggested_replies: [] });

    const result = await analyzeComments(comments, title, language);
    result.count = comments.length;
    res.json(result);
  } catch (err) {
    console.error('[AI/COMMENTS]', err.message);
    res.status(500).json({ error: 'Analyse des commentaires indisponible', details: err.message });
  }
});

/* ── Chapitres horodatés (Pro/Business) ── */
router.post('/ai/chapters', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId, transcript: clientTranscript = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Chapitres réservés aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    // Transcription : celle de l'extension en priorité, sinon tentative serveur
    let transcript = (clientTranscript && clientTranscript.trim().length > 30) ? clientTranscript : '';
    if (!transcript && videoId) {
      const tr = await getTranscript(videoId);
      if (tr.available && tr.segments.length) {
        let last = -100, lines = [];
        for (const s of tr.segments) {
          if (s.start - last >= 15) { lines.push(`[${secToTimestamp(s.start)}] ${s.text}`); last = s.start; }
          else if (lines.length) lines[lines.length - 1] += ' ' + s.text;
        }
        transcript = lines.join('\n').slice(0, 6000);
      }
    }
    if (!transcript) return res.status(404).json({ error: 'Sous-titres indisponibles pour cette vidéo (chapitres impossibles).' });

    const result = await generateChapters(transcript, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/CHAPTERS]', err.message);
    res.status(500).json({ error: 'Génération des chapitres indisponible', details: err.message });
  }
});

/* ── Générateur d'idées de vidéos (Pro/Business) ── */
router.post('/ai/ideas', async (req, res) => {
  try {
    const { activation_id, activation_secret, niche = '', region = '', topic = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Générateur d\'idées réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await generateVideoIdeas(niche, region, topic, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/IDEAS]', err.message);
    res.status(500).json({ error: 'Générateur d\'idées indisponible', details: err.message });
  }
});

/* ── Title Doctor : diagnostic CTR + amélioration (Pro/Business) ── */
router.post('/ai/title-doctor', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    if (!title || title.trim().length < 3) return res.status(400).json({ error: 'Titre requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Title Doctor réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await titleDoctor(title, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/TITLE-DOCTOR]', err.message);
    res.status(500).json({ error: 'Title Doctor indisponible', details: err.message });
  }
});

/* ── Kit Sponsor & Monétisation (Pro/Business) ── */
router.post('/ai/sponsor', async (req, res) => {
  try {
    const { activation_id, activation_secret, niche = '', region = '', subscribers = 0, avg_views = 0, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });

    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)        return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (ctx.expired) return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    if (!requirePaidPlan(ctx.plan)) {
      return res.status(403).json({ error: 'Kit Sponsor réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    }

    const result = await sponsorKit(niche, region, subscribers, avg_views, language);
    res.json(result);
  } catch (err) {
    console.error('[AI/SPONSOR]', err.message);
    res.status(500).json({ error: 'Kit Sponsor indisponible', details: err.message });
  }
});

/* ── Planificateur de contenu 7 jours (Pro/Business) ── */
router.post('/ai/plan', async (req, res) => {
  try {
    const { activation_id, activation_secret, niche = '', region = '', frequency = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Planificateur réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    res.json(await generateContentPlan(niche, region, frequency, language));
  } catch (err) {
    console.error('[AI/PLAN]', err.message);
    res.status(500).json({ error: 'Planificateur indisponible', details: err.message });
  }
});

/* ── Localisation / traduction des métadonnées (Pro/Business) ── */
router.post('/ai/translate', async (req, res) => {
  try {
    const { activation_id, activation_secret, title, description = '', target_lang = 'en', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !title) return res.status(400).json({ error: 'Titre requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Traduction réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    res.json(await translateMetadata(title, description, target_lang, language));
  } catch (err) {
    console.error('[AI/TRANSLATE]', err.message);
    res.status(500).json({ error: 'Traduction indisponible', details: err.message });
  }
});

/* ── Posts communautaires (Pro/Business) ── */
router.post('/ai/community', async (req, res) => {
  try {
    const { activation_id, activation_secret, niche = '', topic = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret) return res.status(400).json({ error: 'ID et Secret requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Posts communautaires réservés aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    res.json(await generateCommunityPosts(niche, topic, language));
  } catch (err) {
    console.error('[AI/COMMUNITY]', err.message);
    res.status(500).json({ error: 'Posts communautaires indisponibles', details: err.message });
  }
});

/* ── Générateur de script (Pro/Business) ── */
router.post('/ai/script', async (req, res) => {
  try {
    const { activation_id, activation_secret, topic, niche = '', duration = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !topic) return res.status(400).json({ error: 'Sujet requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Générateur de script réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    res.json(await generateScript(topic, niche, duration, language));
  } catch (err) {
    console.error('[AI/SCRIPT]', err.message);
    res.status(500).json({ error: 'Générateur de script indisponible', details: err.message });
  }
});

/* ── Vérif Titre + Miniature (Pro/Business) ── */
router.post('/ai/pair-check', async (req, res) => {
  try {
    const { activation_id, activation_secret, videoId, title = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !videoId) return res.status(400).json({ error: 'Paramètres requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Vérif Titre+Miniature réservée aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    let b64 = null;
    for (const q of ['maxresdefault', 'hqdefault', 'mqdefault']) {
      try { const ir = await fetch(`https://i.ytimg.com/vi/${videoId}/${q}.jpg`); if (ir.ok) { const buf = Buffer.from(await ir.arrayBuffer()); if (buf.length > 1000) { b64 = buf.toString('base64'); break; } } } catch (e) {}
    }
    if (!b64) return res.status(404).json({ error: 'Miniature introuvable' });
    res.json(await pairCheck(title, b64, language));
  } catch (err) {
    console.error('[AI/PAIR-CHECK]', err.message);
    res.status(500).json({ error: 'Vérif indisponible', details: err.message });
  }
});

/* ── Optimiseur de playlists (Pro/Business) ── */
router.post('/ai/playlists', async (req, res) => {
  try {
    const { activation_id, activation_secret, channelId, language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !channelId) return res.status(400).json({ error: 'channelId requis' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Optimiseur de playlists réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });
    const videos = await getChannelVideos(channelId, 30);
    if (!videos.length) return res.status(404).json({ error: 'Aucune vidéo trouvée' });
    res.json(await optimizePlaylists(videos, language));
  } catch (err) {
    console.error('[AI/PLAYLISTS]', err.message);
    res.status(500).json({ error: 'Optimiseur de playlists indisponible', details: err.message });
  }
});

/* ── Détecteur de tendances (Pro/Business) ── */
router.post('/ai/trends', async (req, res) => {
  try {
    const { activation_id, activation_secret, niche = '', region = '', language = 'fr' } = req.body;
    if (!activation_id || !activation_secret || !niche) return res.status(400).json({ error: 'Niche requise' });
    const supabase = req.app.locals.supabase;
    const ctx = await getCodeUser(supabase, activation_id, activation_secret, req);
    if (!ctx)                       return res.status(401).json({ error: 'ID ou Secret invalide' });
    if (!requirePaidPlan(ctx.plan)) return res.status(403).json({ error: 'Détecteur de tendances réservé aux abonnés Pro et Business.', code: 'UPGRADE_REQUIRED' });

    // On cherche la niche seule (ajouter la région polluerait la requête) ;
    // les régions/pays précis affinent, les groupes génériques (Mondial…) sont ignorés.
    const generic = /mondial|monde|pays |worldwide|عالمي|世界|général/i.test(region);
    const query = (region && !generic) ? `${niche} ${region}` : niche;
    let videos = await getTrendingVideos(query, 12);
    if (!videos.length && query !== niche) videos = await getTrendingVideos(niche, 12);  // repli sur la niche seule
    if (!videos.length) return res.json({ videos: [], trends: [], rising_keywords: [], advice: [], empty: true });
    const analysis = await detectTrends(videos, niche, language);
    res.json({ videos: videos.slice(0, 8), ...analysis });
  } catch (err) {
    console.error('[AI/TRENDS]', err.message);
    res.status(500).json({ error: 'Détecteur de tendances indisponible', details: err.message });
  }
});

module.exports = router;
