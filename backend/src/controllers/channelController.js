const { getSupabase } = require('../config/supabase');

class ChannelController {
  async listChannels(req, res, next) {
    try {
      const { data: channels, error } = await getSupabase()
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
      const { data: user } = await getSupabase()
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single();

      const limit = user.plan === 'business' ? 5 : 1;

      if (channels.length > limit) {
        return res.status(400).json({ error: `Your plan allows a maximum of ${limit} channel(s)` });
      }

      // Check if user already has channels locked
      const { data: existingChannels } = await getSupabase()
        .from('user_channels')
        .select('id')
        .eq('user_id', userId);

      if (existingChannels && existingChannels.length > 0) {
         return res.status(403).json({ error: 'Channels are already selected and cannot be changed.' });
      }

      // Insert new channels
      const channelsToInsert = channels.map(ch => ({
        user_id: userId,
        youtube_channel_id: ch.youtube_channel_id,
        channel_name: ch.channel_name || 'My Channel',
        is_primary: true // Set first one as primary
      }));

      const { data, error } = await getSupabase()
        .from('user_channels')
        .insert(channelsToInsert)
        .select();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChannelController();
