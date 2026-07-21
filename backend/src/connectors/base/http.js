/**
 * Wrapper HTTP neutre pour les échanges OAuth (token exchange, appels API authentifiés).
 * Aucune connaissance de plateforme — juste une normalisation des erreurs réseau/HTTP pour
 * que classifyError() (utils/withProviderCall.js) puisse les classer de façon générique.
 * Utilise le fetch global (Node 18+ / 22 ici, cf. package.json engines).
 *
 * Résilience (contrat OAuth de référence, §09) :
 *  - Timeout par défaut 10s (AbortController) → err.code = 'TIMEOUT'
 *  - Panne réseau (DNS, connexion refusée) → err.code = 'NETWORK_ERROR'
 *  - 5xx → err.code = 'SERVER_ERROR' ; 429 → err.code = 'RATE_LIMITED' (déjà en Phase 1)
 *  - withRetry() : retry limité réservé aux appels IDEMPOTENTS (fetchProfile, verifyScopes).
 *    JAMAIS utilisé pour exchangeAuthorizationCode (code à usage unique) ni refreshAccessToken
 *    (refresh token potentiellement rotatif) — un Provider ne doit jamais les envelopper dedans.
 */

const DEFAULT_TIMEOUT_MS = 10000;

class HttpError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** Exécute fetch(url, options) avec un timeout, classifie timeout/panne réseau. */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      const timeoutErr = new Error(`Timeout après ${timeoutMs}ms (${url})`);
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    const netErr = new Error((err && err.message) || 'Erreur réseau');
    netErr.code = 'NETWORK_ERROR';
    throw netErr;
  } finally {
    clearTimeout(timer);
  }
}

/** POST x-www-form-urlencoded, renvoie le JSON parsé. Lève HttpError si status >= 400. */
async function postForm(url, params, { timeoutMs } = {}) {
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  }, timeoutMs);
  return parseJsonOrThrow(res);
}

/** GET avec Authorization: Bearer, renvoie le JSON parsé. Lève HttpError si status >= 400. */
async function getJson(url, accessToken, { headers = {}, timeoutMs } = {}) {
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, ...headers }
  }, timeoutMs);
  return parseJsonOrThrow(res);
}

async function parseJsonOrThrow(res) {
  let body = null;
  try { body = await res.json(); } catch (e) { /* réponse non-JSON, body reste null */ }
  if (!res.ok) {
    let code;
    if (res.status === 429) code = 'RATE_LIMITED';
    else if (res.status >= 500) code = 'SERVER_ERROR';
    throw new HttpError(`HTTP ${res.status} ${res.statusText}`, { status: res.status, code, body });
  }
  return body;
}

/**
 * Retry limité — réservé aux appels IDEMPOTENTS (voir avertissement en tête de fichier).
 * Backoff exponentiel court, ne retente que sur TIMEOUT/NETWORK_ERROR/SERVER_ERROR — jamais
 * sur une erreur 4xx (erreur du client, un retry ne changerait rien).
 * @param {function(): Promise<any>} fn
 * @param {{ retries?: number, delayMs?: number, isRetryable?: function(Error): boolean }} [opts]
 */
async function withRetry(fn, opts = {}) {
  const retries = opts.retries ?? 1;
  const delayMs = opts.delayMs ?? 250;
  const isRetryable = opts.isRetryable || defaultIsRetryable;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) throw err;
      await sleep(delayMs * 2 ** attempt);
    }
  }
  throw lastErr;
}

function defaultIsRetryable(err) {
  return !!(err && ['TIMEOUT', 'NETWORK_ERROR', 'SERVER_ERROR'].includes(err.code));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { postForm, getJson, fetchWithTimeout, withRetry, defaultIsRetryable, HttpError, DEFAULT_TIMEOUT_MS };
