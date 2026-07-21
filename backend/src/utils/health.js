/**
 * Calcul générique de l'état de santé d'un compte connecté (voir note d'architecture §14).
 *
 * Deux temps :
 *  1) Ce que le cœur applicatif peut déduire seul (absence de ligne, expiration, config
 *     manquante) — calculé ici, identique pour tout Provider.
 *  2) Ce que seul le Provider peut savoir (limite de débit, scope refusé, panne distante) —
 *     rapporté via account.lastError.code par withProviderCall.js, jamais deviné ici.
 */

const { ERROR_CODE_TO_HEALTH } = require('../connectors/base/errorCodes');

const HEALTH_STATES = Object.freeze([
  'connected',
  'disconnected',
  'expired_token',
  'refresh_failed',
  'missing_scope',
  'rate_limited',
  'config_error',
  'provider_unavailable'
]);

/**
 * @param {{status?: string, tokenExpiresAt?: string|Date|null, lastError?: {code?: string}}|null} account
 * @param {import('../connectors/base/contract').Manifest} [manifest]
 * @param {{ hasRequiredEnvVars?: function(manifest): boolean, now?: function(): number }} [deps]
 * @returns {import('../connectors/base/contract').HealthState}
 */
function computeHealth(account, manifest, deps = {}) {
  const now = deps.now || (() => Date.now());

  if (!account) return 'disconnected';
  if (account.status === 'revoked') return 'disconnected';

  if (manifest && manifest.auth && manifest.auth.type === 'oauth2' && typeof deps.hasRequiredEnvVars === 'function') {
    if (!deps.hasRequiredEnvVars(manifest)) return 'config_error';
  }

  if (account.tokenExpiresAt) {
    const expiry = account.tokenExpiresAt instanceof Date
      ? account.tokenExpiresAt.getTime()
      : new Date(account.tokenExpiresAt).getTime();
    if (!Number.isNaN(expiry) && expiry < now()) return 'expired_token';
  }

  const errorCode = account.lastError && account.lastError.code;
  if (errorCode && ERROR_CODE_TO_HEALTH[errorCode]) {
    return ERROR_CODE_TO_HEALTH[errorCode];
  }

  return 'connected';
}

module.exports = { computeHealth, HEALTH_STATES, ERROR_CODE_TO_HEALTH };
