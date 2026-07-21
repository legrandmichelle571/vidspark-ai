/**
 * Appels API TikTok en lecture (idempotents) — seuls ceux-ci tolèrent un retry limité
 * (contrat §09), contrairement aux appels du cycle OAuth (oauth.js).
 */
const { getJson, withRetry } = require('../base/http');
const config = require('./config');

const PROFILE_FIELDS = 'open_id,display_name,avatar_url';

/**
 * @param {string} accessToken
 * @returns {Promise<import('../base/contract').ExternalProfile>}
 */
async function fetchProfile(accessToken) {
  const raw = await withRetry(
    () => getJson(`${config.ENDPOINTS.userInfo}?fields=${PROFILE_FIELDS}`, accessToken),
    { retries: 1 }
  );
  if (raw && raw.error && raw.error.code && raw.error.code !== 'ok') {
    const err = new Error(raw.error.message || 'Erreur API TikTok (user/info)');
    err.code = mapTikTokErrorCode(raw.error.code);
    throw err;
  }
  const user = (raw && raw.data && raw.data.user) || {};
  return {
    externalId: user.open_id,
    externalName: user.display_name || user.open_id,
    avatarUrl: user.avatar_url || null
  };
}

/**
 * TikTok n'expose pas d'endpoint d'introspection scope-par-scope dédié — verifyScopes()
 * renvoie donc la MEILLEURE VALEUR CONNUE (les scopes accordés lors du dernier échange de
 * token), pas une vérification live. Documenté explicitement (contrat §07), pas une fausse
 * promesse : un futur mainteneur ne doit pas supposer que ceci interroge TikTok en direct.
 * @param {{ grantedScopes?: string[] }} account
 */
async function verifyScopes(account) {
  return {
    grantedScopes: (account && account.grantedScopes) || [],
    expiredScopes: [],
    refusedScopes: []
  };
}

function mapTikTokErrorCode(tiktokCode) {
  const known = { access_token_invalid: 'REFRESH_FAILED', scope_not_authorized: 'MISSING_SCOPE', rate_limit_exceeded: 'RATE_LIMITED' };
  return known[tiktokCode] || 'UNKNOWN';
}

module.exports = { fetchProfile, verifyScopes, mapTikTokErrorCode };
