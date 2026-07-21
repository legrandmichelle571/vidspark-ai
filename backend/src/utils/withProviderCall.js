/**
 * Enveloppe générique pour tout appel à un Provider (OAuth, refresh, sync). Point de passage
 * UNIQUE pour la journalisation — un Provider n'écrit jamais lui-même de log ni de ligne
 * d'événement, il attache seulement un err.code reconnu à ses erreurs (voir classifyError).
 *
 * Conçu par injection de dépendances (logEvent/recordError) plutôt qu'en important Supabase
 * directement : 100% testable sans base de données, et inerte tant que personne ne branche de
 * vraies fonctions de persistance (ce qui n'arrive pas en Phase 1).
 *
 * Convention de log console : "[connections:<platform>:<eventType>] <message>" — cohérente avec
 * les logs déjà présents dans le backend (ex. "[GET /user/channels]", routes/user.js).
 */

const KNOWN_ERROR_CODES = new Set([
  'RATE_LIMITED',
  'MISSING_SCOPE',
  'REFRESH_FAILED',
  'PROVIDER_DOWN',
  'PROVIDER_UNAVAILABLE',
  'CONFIG_ERROR',
  'INVALID_GRANT'
]);

/**
 * @param {Error} err
 * @returns {string} un code reconnu, ou 'UNKNOWN' si le Provider n'en a fourni aucun de valide
 */
function classifyError(err) {
  if (err && typeof err.code === 'string' && KNOWN_ERROR_CODES.has(err.code)) {
    return err.code;
  }
  if (err && err.status === 429) return 'RATE_LIMITED'; // cas HttpError (base/http.js)
  return 'UNKNOWN';
}

/**
 * @param {{
 *   logEvent?: function({accountId, platform, eventType, detail}): Promise<void>,
 *   recordError?: function({accountId, code, message}): Promise<void>,
 *   logger?: { error: function(string): void }
 * }} deps
 * @returns {function(string, string, string, function(): Promise<any>): Promise<any>} withProviderCall
 */
function createProviderCallWrapper(deps = {}) {
  const logEvent = typeof deps.logEvent === 'function' ? deps.logEvent : null;
  const recordError = typeof deps.recordError === 'function' ? deps.recordError : null;
  const logger = deps.logger || console;

  /**
   * @param {string} platform    manifest.key du Provider
   * @param {string} accountId   id de connected_accounts (ou null si pas encore créé, ex. /start)
   * @param {string} eventType   'oauth_start' | 'oauth_exchange' | 'refresh' | 'sync_profile' | …
   * @param {function(): Promise<any>} fn
   */
  return async function withProviderCall(platform, accountId, eventType, fn) {
    try {
      const result = await fn();
      if (logEvent) await logEvent({ accountId, platform, eventType: `${eventType}_success`, detail: {} });
      return result;
    } catch (err) {
      const code = classifyError(err);
      const message = err && err.message ? err.message : String(err);
      if (recordError) {
        await recordError({ accountId, code, message, at: new Date().toISOString() });
      }
      if (logEvent) {
        await logEvent({ accountId, platform, eventType: `${eventType}_error`, detail: { code, message } });
      }
      logger.error(`[connections:${platform}:${eventType}] ${message}`);
      throw err;
    }
  };
}

module.exports = { createProviderCallWrapper, classifyError, KNOWN_ERROR_CODES };
