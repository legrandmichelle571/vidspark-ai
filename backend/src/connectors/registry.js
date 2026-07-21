/**
 * Registre dynamique des Providers — SEULE source de vérité de la liste des plateformes.
 *
 * loadRegistry(dir) scanne un dossier et charge chaque sous-dossier (sauf "base" et tout
 * dossier commençant par "__") comme un Provider, en validant son contrat. N'exécute AUCUN
 * appel réseau, ne touche à AUCUNE table : c'est un simple require() + validation.
 *
 * ⚠️ Phase 1 : ce module n'est appelé nulle part dans l'application (aucune route ne l'importe).
 * Il n'a donc aucun effet tant qu'il n'est pas explicitement invoqué — ce qui n'arrivera qu'à
 * partir de la Phase 4 (routes génériques), sur le dossier connectors/ réel une fois qu'il
 * contiendra de vrais Providers (youtube/, tiktok/…).
 */
const fs = require('fs');
const path = require('path');
const { assertValidProvider, ProviderContractError } = require('./base/contract');
const { grantedCapabilities } = require('../utils/capabilities');
const { computeHealth } = require('../utils/health');

const IGNORED_DIR_PATTERN = /^(base|__.*)$/;

/**
 * Garantit que tout Provider chargé expose getCapabilities/getHealth, qu'il les définisse
 * lui-même (surcharge) ou non (défaut générique lié à son manifest). Le cœur applicatif
 * n'appelle JAMAIS grantedCapabilities()/computeHealth() directement une fois un Provider
 * passé par le registre — toujours provider.getCapabilities(...)/provider.getHealth(...),
 * qu'il s'agisse de l'implémentation par défaut ou d'une surcharge. C'est ce qui garantit
 * que "le cœur utilise toujours l'interface publique du Provider".
 * @param {import('./base/contract').Provider} provider
 * @returns {import('./base/contract').Provider} même provider, avec les deux méthodes garanties
 */
function attachDefaultInterface(provider) {
  const getCapabilities = provider.getCapabilities
    || ((grantedScopes) => grantedCapabilities(provider.manifest, grantedScopes));
  // async même si computeHealth() est synchrone : le contrat déclare getHealth comme
  // renvoyant toujours une Promise<HealthState>, surcharge ou défaut confondus — un
  // appelant ne doit jamais avoir à savoir laquelle des deux il a en main.
  const getHealth = provider.getHealth
    || (async (account, deps) => computeHealth(account, provider.manifest, deps));
  return { ...provider, getCapabilities, getHealth };
}

/**
 * @param {string} dir  Dossier à scanner (chaque sous-dossier = un Provider).
 * @returns {Object.<string, import('./base/contract').Provider>} registre indexé par manifest.key
 * @throws {ProviderContractError} si un Provider présent est invalide (fail-fast : on préfère
 *         un démarrage qui échoue clairement plutôt qu'un Provider à moitié fonctionnel en prod)
 */
function loadRegistry(dir) {
  if (!dir) throw new Error('loadRegistry(dir) : un dossier est requis');
  const providers = {};
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    throw new Error(`loadRegistry : impossible de lire "${dir}" (${err.message})`);
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIR_PATTERN.test(entry.name)) continue;

    const modPath = path.join(dir, entry.name);
    let provider;
    try {
      provider = require(modPath);
    } catch (err) {
      throw new Error(`Provider "${entry.name}" : échec du chargement (${err.message})`);
    }

    assertValidProvider(provider, entry.name); // lève ProviderContractError si invalide

    if (providers[provider.manifest.key]) {
      throw new Error(
        `Provider "${entry.name}" : la clé "${provider.manifest.key}" est déjà utilisée par un autre dossier`
      );
    }
    providers[provider.manifest.key] = attachDefaultInterface(provider);
  }

  return providers;
}

/**
 * Accesseur mémoïsé — garantit qu'un seul scan disque (fs.readdirSync + require + validation)
 * a lieu par dossier, quel que soit le nombre d'appels. À utiliser par les routes (Phase 4) au
 * lieu de loadRegistry() directement, pour ne jamais re-scanner le système de fichiers à chaque
 * requête HTTP. loadRegistry() reste exportée telle quelle pour les tests, qui ont besoin d'un
 * chargement frais à chaque scénario.
 * @type {Map<string, Object.<string, import('./base/contract').Provider>>}
 */
const _cache = new Map();

/**
 * @param {string} dir
 * @returns {Object.<string, import('./base/contract').Provider>} la MÊME référence d'objet
 *          à chaque appel pour un dir donné, tant que resetRegistryCache() n'a pas été appelé.
 */
function getRegistry(dir) {
  const resolved = path.resolve(dir);
  if (!_cache.has(resolved)) {
    _cache.set(resolved, loadRegistry(resolved));
  }
  return _cache.get(resolved);
}

/** Réservé aux tests : vide le cache pour forcer un rechargement au prochain getRegistry(). */
function resetRegistryCache() {
  _cache.clear();
}

module.exports = { loadRegistry, getRegistry, resetRegistryCache, attachDefaultInterface, ProviderContractError };
