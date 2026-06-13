const { getSupabaseAdmin } = require('../config/supabase');
const { getChannelLimit } = require('../config/channelLimits');
const { resolveChannelId } = require('../utils/youtube');

class ChannelController {
  async listChannels(req, res, next) {
    try {
      const { data: channels, error } = await getSupabaseAdmin()
        .from('user_channels')
        .select('*')
        .eq('user_id', req.user.id);

      if (error) throw error;

      res.json({ success: true, data: channels });
    } catch (err) {
      next(err);
    }
  }

  async selectChannels(req, res, next) {
    try {
      const { channels } = req.body;
      const userId = req.user.id;

      if (!channels || !Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({ error: 'No channels provided' });
      }

      // Check user plan limit
      const { data: user } = await getSupabaseAdmin()
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single();

      const limit = getChannelLimit(user.plan);

      if (channels.length > limit) {
        return res.status(400).json({ error: `Your plan allows a maximum of ${limit} channel(s)` });
      }

      // Si l'utilisateur a déjà des chaînes, les supprimer pour les remplacer
      // (Plan Free/Pro: 1 chaîne max, Plan Business: 5 max, Plan Diamant: 10 max)
      const { data: existingChannels } = await getSupabaseAdmin()
        .from('user_channels')
        .select('id')
        .eq('user_id', userId);

      if (existingChannels && existingChannels.length > 0) {
        // Supprimer les anciennes chaînes pour permettre le changement
        const { error: deleteError } = await getSupabaseAdmin()
          .from('user_channels')
          .delete()
          .eq('user_id', userId);
        if (deleteError) throw deleteError;
      }

      // Résoudre chaque entrée (lien / @handle / nom) en vrai Channel ID UC
      const resolved = [];
      for (const ch of channels) {
        const raw = ch.youtube_channel_id;
        let r = null;
        try {
          r = await resolveChannelId(raw);
        } catch (e) {
          console.error(`[selectChannels] Erreur resolveChannelId(${raw}):`, e.message);
          return res.status(400).json({ error: `Erreur lors de la résolution du lien : ${e.message}` });
        }
        if (!r || !r.id) {
          console.warn(`[selectChannels] Chaîne introuvable : ${raw}`);
          return res.status(400).json({ error: `Chaîne introuvable : ${raw}. Vérifie le lien de ta chaîne.` });
        }
        resolved.push(r);
      }

      // Insert new channels
      const channelsToInsert = resolved.map((r, i) => ({
        user_id: userId,
        youtube_channel_id: r.id,
        channel_name: (channels[i].channel_name && !/^Chaîne |^My Channel$/.test(channels[i].channel_name))
          ? channels[i].channel_name
          : (r.name || 'My Channel'),
        is_primary: i === 0 // Première chaîne = principale
      }));

      const { data, error } = await getSupabaseAdmin()
        .from('user_channels')
        .insert(channelsToInsert)
        .select();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async verifyChannel(req, res) {
    try {
      const { youtube_channel_id } = req.body;
      const userId = req.user.id;

      if (!youtube_channel_id) {
        return res.status(403).json({
          code: 'CHANNEL_NOT_AUTHORIZED',
          error: 'youtube_channel_id est requis'
        });
      }

      const { data: channels, error } = await getSupabaseAdmin()
        .from('user_channels')
        .select('id')
        .eq('user_id', userId)
        .eq('youtube_channel_id', youtube_channel_id);

      if (error) throw error;

      if (!channels || channels.length === 0) {
        return res.status(403).json({
          code: 'CHANNEL_NOT_AUTHORIZED',
          error: 'Chaîne non autorisée pour cet utilisateur'
        });
      }

      res.json({ authorized: true });
    } catch (err) {
      console.error('Erreur verifyChannel:', err);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
}

module.exports = new ChannelController();
