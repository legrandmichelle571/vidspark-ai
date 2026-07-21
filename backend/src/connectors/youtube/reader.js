/**
 * Lecture STRICTEMENT SEULE de activation_channels.
 *
 * Reproduit à l'identique la requête de `GET /api/user/channels`
 * (backend/src/routes/user.js, section "Mes chaînes YouTube autorisées") : mêmes
 * colonnes (channel_id, channel_name, created_at), même filtre (user_id), même tri
 * (created_at ascendant). Ce fichier ne contient et ne doit jamais contenir le moindre
 * verbe d'écriture Supabase — vérifié par un test de scan de source, pas seulement
 * promis en commentaire (voir __tests__/noWrites.test.js).
 *
 * N'importe PAS @supabase/supabase-js : le client est injecté par l'appelant (même
 * client que celui déjà utilisé partout ailleurs dans le backend, req.app.locals.supabase).
 * Aucune clé ni connexion supplémentaire.
 */

/**
 * @param {{ from: function }} supabaseClient  Le même client Supabase que le reste du backend.
 * @param {string} userId
 * @returns {Promise<Array<{channel_id: string, channel_name: string|null, created_at: string}>>}
 */
async function readActivationChannels(supabaseClient, userId) {
  if (!supabaseClient) throw new Error('readActivationChannels : supabaseClient requis');
  if (!userId) throw new Error('readActivationChannels : userId requis');

  const { data, error } = await supabaseClient
    .from('activation_channels')
    .select('channel_id, channel_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    const err = new Error(error.message || 'Erreur de lecture activation_channels');
    err.code = 'PROVIDER_DOWN'; // panne de la base, pas une erreur métier YouTube
    throw err;
  }

  return data || [];
}

module.exports = { readActivationChannels };
