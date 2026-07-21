/**
 * Provider TikTok — premier Provider OAuth réel, référence pour toute future intégration
 * (Instagram, Facebook, LinkedIn, X, Twitch, Pinterest, Google…). Implémente le contrat OAuth
 * de référence validé (voir note d'architecture) : startAuthorization/exchangeAuthorizationCode/
 * refreshAccessToken/revokeAccess, fetchProfile, tasks.{syncProfile,verifyScopes}.
 *
 * ⚠️ Comme en Phases 1-2 : aucune route de l'application n'importe ce module. Il n'a aucun
 * effet tant qu'il n'est pas explicitement appelé (Phase 4). Aucune activation TikTok Login
 * Kit n'est requise pour que ces fichiers existent et soient testés — seule l'app réelle
 * TikTok Developer (client_key/secret) est nécessaire pour un usage en production.
 *
 * Persistance : ce module ne lit ni n'écrit JAMAIS de token en base — il reçoit/renvoie
 * uniquement des NormalizedTokenSet en mémoire (contrat §05). Chiffrement, stockage,
 * rotation, expiration : entièrement la responsabilité du cœur (utils/tokenCrypto.js,
 * futures routes Phase 4).
 */
const manifest = require('./manifest');
const auth = require('./oauth');
const { fetchProfile } = require('./api');
const tasks = require('./tasks');
const { computeHealth } = require('../../utils/health');
const config = require('./config');

/**
 * Surcharge de getHealth (point 3 du contrat) : TikTok a un besoin réellement particulier —
 * détecter une config manquante (TIKTOK_CLIENT_KEY/SECRET) nécessite de savoir COMMENT lire
 * cette configuration, ce que seul ce Provider connaît. Le cœur continue d'appeler
 * provider.getHealth(account) sans jamais savoir qu'il s'agit ici d'une surcharge plutôt que
 * du défaut générique — c'est exactement le comportement demandé.
 * @param {Object} account
 * @param {Object} [deps]
 */
async function getHealth(account, deps = {}) {
  return computeHealth(account, manifest, { ...deps, hasRequiredEnvVars: config.hasRequiredEnvVars });
}

module.exports = { manifest, auth, fetchProfile, tasks, getHealth };
