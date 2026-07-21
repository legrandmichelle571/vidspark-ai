/**
 * Point de configuration UNIQUE pour la version/les endpoints de l'API TikTok — contrat
 * OAuth de référence §08 (versionnement). Une évolution d'API TikTok (v2 → v3, endpoint
 * renommé, période de coexistence entre deux versions) ne touche QUE ce fichier ; le cœur
 * applicatif et les autres Providers n'en ont jamais connaissance.
 *
 * Coexistence de versions (si TikTok déprécie progressivement v2) : ajouter les nouvelles
 * URLs sous une clé de version distincte et faire choisir resolveApiVersion() en fonction
 * d'un flag propre à ce Provider (ex: account.metadata.apiVersion) — jamais une variable
 * lue par le cœur ou par un autre Provider.
 */
const API_VERSION = 'v2';

const ENDPOINTS = {
  authorize: 'https://www.tiktok.com/v2/auth/authorize/',
  token: 'https://open.tiktokapis.com/v2/oauth/token/',
  revoke: 'https://open.tiktokapis.com/v2/oauth/revoke/',
  userInfo: 'https://open.tiktokapis.com/v2/user/info/'
};

function clientKey() {
  return process.env.TIKTOK_CLIENT_KEY;
}

function clientSecret() {
  return process.env.TIKTOK_CLIENT_SECRET;
}

/** Utilisé par le calcul générique de santé (config_error) — voir utils/health.js deps.hasRequiredEnvVars. */
function hasRequiredEnvVars() {
  return Boolean(clientKey() && clientSecret());
}

module.exports = { API_VERSION, ENDPOINTS, clientKey, clientSecret, hasRequiredEnvVars };
