/**
 * Vocabulaire des codes d'erreur Provider — SOURCE UNIQUE, consommée par
 * utils/withProviderCall.js (classification) ET utils/health.js (mapping vers un état
 * de santé). Évite la dérive constatée pendant l'audit Phase 1 : les deux fichiers
 * maintenaient chacun leur propre liste, et 'INVALID_GRANT' était reconnu comme code
 * valide par l'un sans être mappé vers un état de santé par l'autre — un Provider qui
 * levait cette erreur pendant un refresh se retrouvait donc affiché "connected" au lieu
 * de "refresh_failed". Toute évolution du vocabulaire se fait maintenant ICI et nulle part
 * ailleurs.
 */

/** @type {Object.<string, import('./contract').HealthState>} */
const ERROR_CODE_TO_HEALTH = Object.freeze({
  RATE_LIMITED: 'rate_limited',
  MISSING_SCOPE: 'missing_scope',
  REFRESH_FAILED: 'refresh_failed',
  INVALID_GRANT: 'refresh_failed', // refresh token révoqué/invalide côté plateforme = un refresh qui échoue
  PROVIDER_DOWN: 'provider_unavailable',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  CONFIG_ERROR: 'config_error'
});

const KNOWN_ERROR_CODES = Object.freeze(new Set(Object.keys(ERROR_CODE_TO_HEALTH)));

module.exports = { ERROR_CODE_TO_HEALTH, KNOWN_ERROR_CODES };
