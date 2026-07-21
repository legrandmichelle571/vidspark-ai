/**
 * Cycle OAuth TikTok — implémente le contrat de référence (startAuthorization /
 * exchangeAuthorizationCode / refreshAccessToken / revokeAccess). Toute réponse brute de
 * l'API TikTok (snake_case) est traduite ICI en NormalizedTokenSet — le cœur applicatif ne
 * voit jamais un champ `access_token`/`open_id` brut.
 *
 * Résilience (contrat §09) : AUCUN retry sur exchangeAuthorizationCode ni refreshAccessToken
 * (code à usage unique / refresh token rotatif — voir base/http.js). revokeAccess ne throw
 * jamais (best-effort).
 */
const { postForm } = require('../base/http');
const config = require('./config');

function assertConfigured() {
  if (!config.hasRequiredEnvVars()) {
    const err = new Error('TIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRET manquant(s)');
    err.code = 'CONFIG_ERROR';
    throw err;
  }
}

/**
 * @param {{ state:string, codeChallenge:string, redirectUri:string, requestedScopes:string[] }} ctx
 * @returns {{ authorizationUrl: string }}
 */
function startAuthorization({ state, codeChallenge, redirectUri, requestedScopes }) {
  assertConfigured();
  const params = new URLSearchParams({
    client_key: config.clientKey(),
    response_type: 'code',
    scope: (requestedScopes || []).join(','),
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  return { authorizationUrl: `${config.ENDPOINTS.authorize}?${params.toString()}` };
}

/** Traduit la réponse brute (snake_case) de TikTok en NormalizedTokenSet. */
function normalizeTokenResponse(raw) {
  if (raw && raw.error) {
    const err = new Error(raw.error_description || raw.error);
    err.code = raw.error === 'invalid_grant' ? 'INVALID_GRANT' : 'UNKNOWN';
    throw err;
  }
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token, // TOUJOURS re-persister : TikTok fait tourner ce token
    expiresIn: raw.expires_in,
    grantedScopes: (raw.scope || '').split(',').map((s) => s.trim()).filter(Boolean)
  };
}

/**
 * @param {string} code
 * @param {{ codeVerifier: string, redirectUri: string }} ctx
 */
async function exchangeAuthorizationCode(code, { codeVerifier, redirectUri } = {}) {
  assertConfigured();
  // Aucun withRetry ici par contrat : code à usage unique (§09).
  const raw = await postForm(config.ENDPOINTS.token, {
    client_key: config.clientKey(),
    client_secret: config.clientSecret(),
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });
  return normalizeTokenResponse(raw);
}

/** @param {string} refreshToken */
async function refreshAccessToken(refreshToken) {
  assertConfigured();
  // Aucun withRetry ici par contrat : refresh token potentiellement rotatif (§09).
  const raw = await postForm(config.ENDPOINTS.token, {
    client_key: config.clientKey(),
    client_secret: config.clientSecret(),
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });
  return normalizeTokenResponse(raw);
}

/** Best-effort — ne throw JAMAIS, quoi qu'il arrive côté TikTok. */
async function revokeAccess(accessToken) {
  try {
    await postForm(config.ENDPOINTS.revoke, {
      client_key: config.clientKey(),
      client_secret: config.clientSecret(),
      token: accessToken
    });
  } catch (_err) {
    // Contrat : la suppression locale de connected_accounts prime, quoi qu'il arrive ici.
  }
}

module.exports = { startAuthorization, exchangeAuthorizationCode, refreshAccessToken, revokeAccess, normalizeTokenResponse };
