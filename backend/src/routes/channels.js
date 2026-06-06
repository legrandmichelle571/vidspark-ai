/**
 * Routes Chaînes YouTube
 * GET  /api/channels/list          — Lister les chaînes de l'utilisateur
 * POST /api/channels/select        — Sélectionner une chaîne (GRATUIT/PRO)
 * POST /api/channels/select-business — Sélectionner 5 chaînes (BUSINESS)
 * GET  /api/channels/verify        — Vérifier que la chaîne actuelle est autorisée
 */

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

// ── Liste des chaînes de l'utilisateur ──
router.get('/list', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('user_channels')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    res.json({
      channels: data || [],
      count: data?.length || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sélectionner une chaîne (GRATUIT/PRO) ──
router.post('/select', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { youtube_channel_id, channel_name } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.plan;

    // Vérifier le plan
    if (!['free', 'pro'].includes(userPlan)) {
      return res.status(400).json({
        error: 'Use /channels/select-business for BUSINESS plan'
      });
    }

    // GRATUIT/PRO: une seule chaîne
    // Supprimer les anciennes chaînes
    await supabase
      .from('user_channels')
      .delete()
      .eq('user_id', userId);

    // Ajouter la nouvelle chaîne
    const { data, error } = await supabase
      .from('user_channels')
      .insert({
        user_id: userId,
        youtube_channel_id,
        channel_name,
        is_primary: true
      })
      .select();

    if (error) throw error;

    res.json({
      success: true,
      channel: data[0]
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Sélectionner 5 chaînes (BUSINESS) ──
router.post('/select-business', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { channels } = req.body;  // Array de {youtube_channel_id, channel_name}
    const userId = req.user.id;
    const userPlan = req.user.plan;

    // Vérifier le plan
    if (userPlan !== 'business') {
      return res.status(403).json({
        error: 'This endpoint is only for BUSINESS plan'
      });
    }

    // Vérifier le nombre de chaînes
    if (!channels || channels.length === 0 || channels.length > 5) {
      return res.status(400).json({
        error: 'BUSINESS plan requires 1-5 channels'
      });
    }

    // Supprimer les anciennes sélections
    await supabase
      .from('user_channels')
      .delete()
      .eq('user_id', userId);

    // Ajouter les nouvelles chaînes
    const channelsToInsert = channels.map(ch => ({
      user_id: userId,
      youtube_channel_id: ch.youtube_channel_id,
      channel_name: ch.channel_name,
      selected_for_business: true
    }));

    const { data, error } = await supabase
      .from('user_channels')
      .insert(channelsToInsert)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      channels: data,
      count: data.length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Vérifier que la chaîne actuelle est autorisée ──
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { youtube_channel_id } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.plan;

    // Récupérer les chaînes autorisées
    const { data, error } = await supabase
      .from('user_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('youtube_channel_id', youtube_channel_id);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(403).json({
        error: 'Channel not authorized for this user',
        code: 'CHANNEL_NOT_AUTHORIZED',
        current_channel: youtube_channel_id,
        plan: userPlan
      });
    }

    res.json({
      success: true,
      authorized: true,
      channel: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
