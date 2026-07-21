/**
 * Calcul générique des capacités réellement accordées à un compte connecté.
 * Une seule implémentation pour toutes les plateformes présentes et futures — voir
 * connectors/base/contract.js pour la forme de manifest.capabilities.
 */

/**
 * @param {import('../connectors/base/contract').Manifest} manifest
 * @param {string[]} grantedScopes  Scopes réellement accordés par l'utilisateur (retour OAuth).
 * @returns {string[]} clés de capacités disponibles pour ce compte
 */
function grantedCapabilities(manifest, grantedScopes = []) {
  if (!manifest || !manifest.capabilities) return [];
  return Object.entries(manifest.capabilities)
    .filter(([, def]) => def && def.supported === true)
    .filter(([, def]) => (def.scopes || []).every((s) => grantedScopes.includes(s)))
    .map(([key]) => key);
}

/**
 * Vue "toutes les capacités déclarées par la plateforme" avec leur état (true/false/'planned'),
 * indépendamment de ce que l'utilisateur a accordé — sert à afficher "bientôt disponible" etc.
 * @param {import('../connectors/base/contract').Manifest} manifest
 * @returns {Object.<string, true|false|'planned'>}
 */
function declaredCapabilityStates(manifest) {
  if (!manifest || !manifest.capabilities) return {};
  const out = {};
  for (const [key, def] of Object.entries(manifest.capabilities)) {
    out[key] = def ? def.supported : false;
  }
  return out;
}

module.exports = { grantedCapabilities, declaredCapabilityStates };
