/**
 * Point de vérité unique : cet utilisateur a-t-il au moins une chaîne YouTube liée ?
 * Utilisé par /api/user/me et /api/auth/google pour ne jamais renvoyer l'ID/Secret
 * d'activation de l'extension avant qu'une chaîne ne soit connectée (activation_channels).
 */
async function hasLinkedChannel(supabase, userId) {
  const { count } = await supabase
    .from('activation_channels')
    .select('channel_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return (count || 0) > 0;
}

module.exports = { hasLinkedChannel };
