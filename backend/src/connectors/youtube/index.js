/**
 * Provider YouTube — adaptateur de compatibilité (Phase 2).
 *
 * Traduit activation_channels (table existante, INCHANGÉE) vers le contrat Provider
 * générique de la Phase 1. N'écrit jamais rien, ne crée aucune ligne dans
 * connected_accounts (ce Provider est auth.type:'none' — il n'a pas de compte OAuth à
 * y stocker), n'ajoute aucune requête réseau/DB par rapport à ce que l'app fait déjà.
 *
 * ⚠️ Comme en Phase 1 : aucune route de l'application n'importe ce module. Il n'a donc
 * aucun effet tant qu'il n'est pas explicitement appelé — ce qui n'arrivera qu'en Phase 4.
 */
const manifest = require('./manifest');
const { readActivationChannels } = require('./reader');
const { createProviderCallWrapper } = require('../../utils/withProviderCall');

function toExternalProfile(row) {
  return {
    externalId: row.channel_id,
    externalName: row.channel_name || row.channel_id,
    avatarUrl: null
  };
}

/**
 * @param {string} userId  Identifiant interne VidSpark (users.id) — PAS un access token :
 *   ce Provider n'a pas d'OAuth (manifest.auth.type === 'none'), sa seule "clé d'accès"
 *   est de savoir pour quel utilisateur lire. Convention documentée dans le guide
 *   développeur pour tout futur Provider auth.type:'none'.
 * @param {{ supabaseClient: object, observability?: object, withProviderCall?: function }} deps
 * @returns {Promise<Array<import('../base/contract').ExternalProfile>>}
 */
async function listAccounts(userId, deps = {}) {
  const { supabaseClient } = deps;
  if (!supabaseClient) {
    throw new Error('listAccounts(userId, { supabaseClient }) : supabaseClient requis');
  }
  const withProviderCall = deps.withProviderCall || createProviderCallWrapper(deps.observability || {});
  const rows = await withProviderCall(manifest.key, userId, 'sync_profile', () =>
    readActivationChannels(supabaseClient, userId)
  );
  return rows.map(toExternalProfile);
}

/**
 * Compatibilité avec le contrat Provider (capabilities.profile ⇒ fetchProfile requis).
 * Renvoie le premier compte (le plus ancien) ou null si aucune chaîne n'est enregistrée —
 * reflète le modèle actuel où le dashboard traite déjà "aucune chaîne" comme un état normal.
 * @param {string} userId
 * @param {{ supabaseClient: object }} deps
 */
async function fetchProfile(userId, deps = {}) {
  const accounts = await listAccounts(userId, deps);
  return accounts[0] || null;
}

const tasks = {
  /** @param {string} userId @param {object} deps */
  syncProfile: async (userId, deps) => listAccounts(userId, deps)
};

module.exports = { manifest, fetchProfile, listAccounts, tasks };
