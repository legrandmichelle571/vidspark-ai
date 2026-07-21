/**
 * PKCE (Proof Key for Code Exchange) — utilitaire neutre partagé par tout Provider OAuth2.
 * Ne connaît aucune plateforme. RFC 7636, méthode S256.
 */
const crypto = require('crypto');

function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Génère une paire { codeVerifier, codeChallenge } prête à l'emploi.
 * codeVerifier : à conserver côté serveur (table oauth_states) jusqu'au callback.
 * codeChallenge : à inclure dans l'URL d'autorisation (code_challenge_method=S256).
 */
function buildPkcePair() {
  const codeVerifier = base64url(crypto.randomBytes(32)); // 43 caractères, dans la plage RFC (43-128)
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

/** Génère un state anti-CSRF/rejeu à usage unique. */
function generateState() {
  return base64url(crypto.randomBytes(24));
}

module.exports = { buildPkcePair, generateState, base64url };
