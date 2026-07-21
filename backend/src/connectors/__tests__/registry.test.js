const path = require('path');
const { loadRegistry } = require('../registry');
const { ProviderContractError } = require('../base/contract');

const FIXTURES = path.join(__dirname, '..', '__fixtures__');

describe('loadRegistry', () => {
  test('charge tous les Providers valides d\'un dossier (oauth2 ET none)', () => {
    const registry = loadRegistry(path.join(FIXTURES, 'scenario-valid'));
    expect(Object.keys(registry).sort()).toEqual(['legacy', 'mock']);
    expect(registry.mock.manifest.auth.type).toBe('oauth2');
    expect(registry.legacy.manifest.auth.type).toBe('none');
  });

  test('ignore le dossier "base" et tout dossier __xxx__', () => {
    // scenario-valid ne contient que mock/ et legacy-adapter/ : si le scan incluait
    // un dossier caché il lèverait (pas de manifest.js) — l'absence d'erreur suffit à prouver
    // que seuls les vrais Providers sont chargés.
    expect(() => loadRegistry(path.join(FIXTURES, 'scenario-valid'))).not.toThrow();
  });

  test('lève ProviderContractError si manifest.key manquant', () => {
    expect(() => loadRegistry(path.join(FIXTURES, 'scenario-missing-key')))
      .toThrow(ProviderContractError);
  });

  test('lève une erreur explicite si auth.type=oauth2 sans implémentation auth', () => {
    expect(() => loadRegistry(path.join(FIXTURES, 'scenario-missing-auth-impl')))
      .toThrow(/aucune implémentation "auth"/);
  });

  test('lève une erreur explicite en cas de clé dupliquée entre deux dossiers', () => {
    expect(() => loadRegistry(path.join(FIXTURES, 'scenario-duplicate-key')))
      .toThrow(/déjà utilisée/);
  });

  test('renvoie un registre vide sur un dossier ne contenant que "base"', () => {
    // Reproduit l'état RÉEL de backend/src/connectors/ en Phase 1 : aucun Provider
    // n'est encore présent, seul base/ existe → le registre doit être vide, pas planter.
    const registry = loadRegistry(path.join(__dirname, '..'), );
    // Le dossier réel connectors/ contient base/, __fixtures__/, __tests__/, registry.js —
    // aucun n'est un Provider valide, donc un scan dessus ne doit lever aucune erreur et
    // renvoyer un registre vide (les fixtures sont ignorées par le pattern __.*).
    expect(registry).toEqual({});
  });

  test('erreur claire si le dossier n\'existe pas', () => {
    expect(() => loadRegistry(path.join(FIXTURES, 'does-not-exist')))
      .toThrow(/impossible de lire/);
  });

  test('erreur si aucun dossier n\'est fourni', () => {
    expect(() => loadRegistry()).toThrow(/dossier est requis/);
  });
});
