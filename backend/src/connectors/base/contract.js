/**
 * Contrat commun d'un Provider — FIGÉ (v1.0) à partir de la Phase 3.
 *
 * Un Provider est un module qui exporte { manifest, auth?, fetchProfile?, listAccounts?,
 * tasks?, getCapabilities?, getHealth? }. Ce fichier ne contient AUCUNE logique métier de
 * plateforme : uniquement la définition du contrat (JSDoc, pour l'outillage/l'IDE) et les
 * fonctions de validation qui garantissent que tout Provider chargé par le registre
 * respecte cette forme.
 *
 * Noms de méthodes définitifs (renommés une seule fois, avant que plusieurs Providers OAuth
 * ne les utilisent — TikTok est le premier à les implémenter et sert de référence) :
 *   auth.startAuthorization / auth.exchangeAuthorizationCode / auth.refreshAccessToken /
 *   auth.revokeAccess. Toute évolution future de ce contrat doit rester rétrocompatible
 *   (nouvelle propriété optionnelle) ou faire l'objet d'une nouvelle version explicite
 *   (jamais un renommage silencieux d'une méthode existante).
 *
 * verifyScopes n'est PAS une méthode de premier niveau : elle s'implémente via le système de
 * tâches existant (tasks.verifyScopes) — pas besoin d'étendre la surface du contrat pour un
 * besoin déjà couvert par un mécanisme générique.
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
 * @typedef {Object} ExternalProfile
 * @property {string} externalId
 * @property {string} [externalName]
 * @property {string} [avatarUrl]
 *
 * @typedef {'connected'|'disconnected'|'expired_token'|'refresh_failed'
 *          |'missing_scope'|'rate_limited'|'config_error'|'provider_unavailable'} HealthState
 *
 * @typedef {Object} NormalizedTokenSet
 * @property {string} accessToken
 * @property {string} refreshToken   Toujours à re-persister, même si elle semble inchangée
 *   (certaines plateformes — TikTok — font tourner le refresh token à chaque appel).
 * @property {number} expiresIn      Secondes. Le CŒUR calcule token_expires_at ; le Provider
 *   ne fait jamais lui-même cette conversion ni aucune écriture en base (§ persistance).
 * @property {string[]} grantedScopes
 *
 * @typedef {Object} ProviderAuth
 * @property {function({state:string, codeChallenge:string=, redirectUri:string, requestedScopes:string[]}): {authorizationUrl:string}} startAuthorization
 *   Le Provider NE GÉNÈRE JAMAIS state/PKCE — fournis par le cœur (base/pkce.js#buildPkcePair).
 *   Reçoit le codeChallenge (public, va dans l'URL) — PAS le codeVerifier (secret, gardé par
 *   le cœur dans oauth_states, transmis seulement à exchangeAuthorizationCode). Aucun appel réseau.
 * @property {function(string, {codeVerifier:string=, redirectUri:string=}=): Promise<NormalizedTokenSet>} exchangeAuthorizationCode
 *   Reçoit ici le codeVerifier (secret) pour compléter la preuve PKCE S256 avec le serveur.
 *   Code à usage unique — AUCUN retry automatique ne doit envelopper cet appel (§résilience).
 * @property {function(string): Promise<NormalizedTokenSet>} refreshAccessToken
 *   AUCUN retry automatique non plus : un refresh token rotatif rend un retry après réponse
 *   perdue dangereux (le token pourrait déjà avoir tourné côté plateforme).
 * @property {function(string): Promise<void>} revokeAccess   Best-effort — ne doit jamais throw.
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
 *   Convention : 'syncProfile', 'verifyScopes' (scopes accordés/expirés/refusés — best-known-
 *   value si la plateforme n'a pas d'introspection live), 'refreshPermissions'.
 * @property {function(string[]): Object.<string, boolean>} [getCapabilities]
 *   Optionnel — SURCHARGE de utils/capabilities.js#grantedCapabilities. Le cœur n'appelle
 *   JAMAIS grantedCapabilities() directement : il appelle toujours provider.getCapabilities,
 *   qui vaut soit cette surcharge, soit une valeur par défaut liée au manifest, attachée
 *   automatiquement par connectors/registry.js au chargement (voir attachDefaultInterface).
 *   Un Provider ne la définit que si une plateforme a un calcul de capacités réellement
 *   particulier — aucun cas identifié à ce jour, TikTok compris.
 * @property {function(Object): Promise<HealthState>} [getHealth]
 *   Optionnel — même principe que getCapabilities : SURCHARGE de utils/health.js#computeHealth,
 *   le cœur appelle toujours provider.getHealth (défaut ou surcharge), jamais computeHealth()
 *   directement. L'adaptateur YouTube ne définit pas getHealth et utilise le défaut.
 */

const RECOGNIZED_CAPABILITIES = [
  'profile', 'videos', 'analytics', 'publish',
  'comments', 'messages', 'search', 'webhook'
];
const VALID_AUTH_TYPES = ['oauth2', 'none'];
const VALID_SUPPORTED_VALUES = [true, false, 'planned'];
/** Méthodes définitives du cycle OAuth (v1.0, figées) — voir en-tête de fichier. */
const OAUTH_METHODS = ['startAuthorization', 'exchangeAuthorizationCode', 'refreshAccessToken', 'revokeAccess'];

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
    for (const method of OAUTH_METHODS) {
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
  // getCapabilities/getHealth restent optionnels, mais s'ils sont présents ce doit être des
  // fonctions — un Provider qui écrirait `getHealth: 'oups'` par erreur doit échouer au
  // chargement plutôt que planter silencieusement au premier appel réel.
  for (const optionalMethod of ['getCapabilities', 'getHealth']) {
    if (provider[optionalMethod] !== undefined && typeof provider[optionalMethod] !== 'function') {
      throw new ProviderContractError(`${sourceLabel} : ${optionalMethod}, si présent, doit être une fonction`);
    }
  }
}

module.exports = {
  RECOGNIZED_CAPABILITIES,
  VALID_AUTH_TYPES,
  OAUTH_METHODS,
  ProviderContractError,
  assertValidManifest,
  assertValidProvider
};
