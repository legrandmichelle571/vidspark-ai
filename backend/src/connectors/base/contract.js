/**
 * Contrat commun d'un Provider (Phase 1 — socle uniquement, aucun Provider réel branché).
 *
 * Un Provider est un module qui exporte { manifest, auth?, fetchProfile?, tasks?, getHealth? }.
 * Ce fichier ne contient AUCUNE logique métier de plateforme : uniquement la définition du
 * contrat (JSDoc, pour l'outillage/l'IDE) et les fonctions de validation qui garantissent que
 * tout Provider chargé par le registre respecte cette forme.
 *
 * @typedef {'oauth2'|'none'} AuthType
 *
 * @typedef {Object} CapabilityDef
 * @property {true|false|'planned'} supported
 * @property {string[]} [scopes]
 *
 * @typedef {Object} Manifest
 * @property {string} key            Identifiant stable, jamais renommé une fois en prod.
 * @property {string} label
 * @property {string} color          Hex.
 * @property {string} icon           Emoji ou URL — rendu tel quel côté frontend, jamais mappé.
 * @property {Object} auth
 * @property {AuthType} auth.type
 * @property {boolean} [auth.supportsRefresh]
 * @property {boolean} [auth.pkce]
 * @property {string[]} [auth.scopesAvailable]
 * @property {Object.<string, CapabilityDef>} capabilities
 *   Clés reconnues : profile, videos, analytics, publish, comments, messages, search, webhook.
 * @property {boolean} multiAccount
 * @property {string[]} [tasks]       Noms des tâches réellement implémentées dans le Provider.
 *
 * @typedef {Object} TokenSet
 * @property {string} accessToken
 * @property {string} [refreshToken]
 * @property {number} expiresIn        Secondes.
 * @property {string[]} grantedScopes
 *
 * @typedef {Object} ExternalProfile
 * @property {string} externalId
 * @property {string} [externalName]
 * @property {string} [avatarUrl]
 *
 * @typedef {'connected'|'disconnected'|'expired_token'|'refresh_failed'
 *          |'missing_scope'|'rate_limited'|'config_error'|'provider_unavailable'} HealthState
 *
 * @typedef {Object} ProviderAuth
 * @property {function(string, string=): string} getAuthUrl
 * @property {function(string, string=): Promise<TokenSet>} exchangeCode
 * @property {function(string): Promise<TokenSet>} refreshToken
 * @property {function(string): Promise<void>} revoke   Best-effort — ne doit jamais throw.
 *
 * @typedef {Object} Provider
 * @property {Manifest} manifest
 * @property {ProviderAuth} [auth]                        Requis si manifest.auth.type === 'oauth2'.
 * @property {function(string, Object=): Promise<ExternalProfile>} [fetchProfile]
 *   Pour un Provider oauth2, le 1er argument est l'access token. Pour un Provider
 *   auth.type:'none' (ex: adaptateur YouTube), c'est l'identifiant interne de
 *   l'utilisateur (users.id) — il n'y a pas de jeton à ce moment. Convention, pas une
 *   contrainte vérifiée par le contrat (JS ne type pas les paramètres).
 * @property {function(string, Object=): Promise<ExternalProfile[]>} [listAccounts]
 *   Optionnel — recommandé quand manifest.multiAccount === true : énumère tous les
 *   comptes disponibles pour un identifiant donné (accessToken ou userId selon
 *   auth.type), alors que fetchProfile n'en renvoie qu'un seul par convention.
 * @property {Object.<string, function>} [tasks]
 * @property {function(Object): Promise<HealthState>} [getHealth]
 *   Optionnel — la plupart des Providers n'en ont pas besoin : utils/health.js
 *   expose un computeHealth() générique qui suffit pour les cas standards (voir
 *   l'adaptateur YouTube, qui ne définit pas getHealth et s'appuie entièrement dessus).
 */

const RECOGNIZED_CAPABILITIES = [
  'profile', 'videos', 'analytics', 'publish',
  'comments', 'messages', 'search', 'webhook'
];
const VALID_AUTH_TYPES = ['oauth2', 'none'];
const VALID_SUPPORTED_VALUES = [true, false, 'planned'];

class ProviderContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProviderContractError';
  }
}

/**
 * Valide un manifest. Lève ProviderContractError avec un message actionnable au premier problème
 * trouvé — utilisé aussi bien par le registre (au chargement) que par les tests unitaires.
 * @param {Manifest} manifest
 * @param {string} sourceLabel  Nom du dossier/Provider, pour un message d'erreur utile.
 */
function assertValidManifest(manifest, sourceLabel = 'Provider') {
  if (!manifest || typeof manifest !== 'object') {
    throw new ProviderContractError(`${sourceLabel} : manifest manquant ou invalide`);
  }
  if (!manifest.key || typeof manifest.key !== 'string' || manifest.key !== manifest.key.toLowerCase()) {
    throw new ProviderContractError(`${sourceLabel} : manifest.key doit être une chaîne en minuscules non vide`);
  }
  if (!manifest.label) {
    throw new ProviderContractError(`${sourceLabel} : manifest.label manquant`);
  }
  if (!manifest.auth || !VALID_AUTH_TYPES.includes(manifest.auth.type)) {
    throw new ProviderContractError(
      `${sourceLabel} : manifest.auth.type doit être ${VALID_AUTH_TYPES.map(t => `"${t}"`).join(' ou ')}`
    );
  }
  if (!manifest.capabilities || typeof manifest.capabilities !== 'object') {
    throw new ProviderContractError(`${sourceLabel} : manifest.capabilities manquant`);
  }
  for (const [key, def] of Object.entries(manifest.capabilities)) {
    if (!RECOGNIZED_CAPABILITIES.includes(key)) {
      throw new ProviderContractError(
        `${sourceLabel} : capacité "${key}" inconnue (attendu parmi ${RECOGNIZED_CAPABILITIES.join(', ')})`
      );
    }
    if (!def || !VALID_SUPPORTED_VALUES.includes(def.supported)) {
      throw new ProviderContractError(
        `${sourceLabel} : capabilities.${key}.supported doit valoir true, false ou "planned"`
      );
    }
    if (def.supported === true && (!Array.isArray(def.scopes) || def.scopes.length === 0) && manifest.auth.type === 'oauth2') {
      throw new ProviderContractError(
        `${sourceLabel} : capabilities.${key} est supportée mais ne déclare aucun scope`
      );
    }
  }
  if (typeof manifest.multiAccount !== 'boolean') {
    throw new ProviderContractError(`${sourceLabel} : manifest.multiAccount doit être un booléen`);
  }
}

/**
 * Valide un Provider complet (manifest + implémentation cohérente avec auth.type).
 * @param {Provider} provider
 * @param {string} sourceLabel
 */
function assertValidProvider(provider, sourceLabel = 'Provider') {
  if (!provider || typeof provider !== 'object') {
    throw new ProviderContractError(`${sourceLabel} : export invalide (attendu un objet { manifest, ... })`);
  }
  assertValidManifest(provider.manifest, sourceLabel);
  if (provider.manifest.auth.type === 'oauth2') {
    if (!provider.auth) {
      throw new ProviderContractError(
        `${sourceLabel} : auth.type="oauth2" mais aucune implémentation "auth" exportée`
      );
    }
    for (const method of ['getAuthUrl', 'exchangeCode', 'refreshToken', 'revoke']) {
      if (typeof provider.auth[method] !== 'function') {
        throw new ProviderContractError(`${sourceLabel} : auth.${method} doit être une fonction`);
      }
    }
  }
  if (provider.manifest.capabilities?.profile?.supported === true && typeof provider.fetchProfile !== 'function') {
    throw new ProviderContractError(
      `${sourceLabel} : capabilities.profile est supportée mais fetchProfile n'est pas exporté`
    );
  }
  if (Array.isArray(provider.manifest.tasks)) {
    for (const taskName of provider.manifest.tasks) {
      if (!provider.tasks || typeof provider.tasks[taskName] !== 'function') {
        throw new ProviderContractError(
          `${sourceLabel} : manifest.tasks déclare "${taskName}" mais tasks.${taskName} n'est pas exporté`
        );
      }
    }
  }
}

module.exports = {
  RECOGNIZED_CAPABILITIES,
  VALID_AUTH_TYPES,
  ProviderContractError,
  assertValidManifest,
  assertValidProvider
};
