/**
 * Wrapper HTTP neutre pour les échanges OAuth (token exchange, appels API authentifiés).
 * Aucune connaissance de plateforme — juste une normalisation des erreurs réseau/HTTP
 * pour que classifyError() (utils/withProviderCall.js) puisse les classer de façon générique.
 * Utilise le fetch global (Node 18+ / 22 ici, cf. package.json engines).
 */

class HttpError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** POST x-www-form-urlencoded, renvoie le JSON parsé. Lève HttpError si status >= 400. */
async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });
  return parseJsonOrThrow(res);
}

/** GET avec Authorization: Bearer, renvoie le JSON parsé. Lève HttpError si status >= 400. */
async function getJson(url, accessToken, { headers = {} } = {}) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, ...headers }
  });
  return parseJsonOrThrow(res);
}

async function parseJsonOrThrow(res) {
  let body = null;
  try { body = await res.json(); } catch (e) { /* réponse non-JSON, body reste null */ }
  if (!res.ok) {
    const code = res.status === 429 ? 'RATE_LIMITED' : undefined;
    throw new HttpError(`HTTP ${res.status} ${res.statusText}`, { status: res.status, code, body });
  }
  return body;
}

module.exports = { postForm, getJson, HttpError };
