const fs = require('fs');
const path = require('path');
const { loadRegistry, getRegistry, resetRegistryCache } = require('../registry');
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

  test('un scan du vrai dossier connectors/ ne contient QUE les Providers réels (youtube depuis la Phase 2)', () => {
    // Mise à jour Phase 2 : ce test vérifiait un registre vide en Phase 1 (seul base/
    // existait). Depuis l'ajout de connectors/youtube/ (adaptateur réel, lecture seule),
    // le registre contient exactement { youtube }. Toujours aucune fixture/mock dedans.
    const registry = loadRegistry(path.join(__dirname, '..'));
    expect(Object.keys(registry)).toEqual(['youtube']);
    expect(registry.youtube.manifest.auth.type).toBe('none');
  });

  test('erreur claire si le dossier n\'existe pas', () => {
    expect(() => loadRegistry(path.join(FIXTURES, 'does-not-exist')))
      .toThrow(/impossible de lire/);
  });

  test('erreur si aucun dossier n\'est fourni', () => {
    expect(() => loadRegistry()).toThrow(/dossier est requis/);
  });

  test('erreur explicite si le module d\'un Provider throw à son propre chargement (pas juste un contrat invalide)', () => {
    expect(() => loadRegistry(path.join(FIXTURES, 'scenario-require-throws')))
      .toThrow(/broken-require.*échec du chargement/s);
  });

  test('un scan du vrai dossier connectors/ ne peut jamais exposer le Mock Provider (preuve par comportement)', () => {
    // __fixtures__ (et __tests__) sont ignorés par le pattern __.* — le Mock Provider n'est donc
    // JAMAIS découvrable via un scan du dossier connectors/ réel, quel que soit son contenu futur.
    const registry = loadRegistry(path.join(__dirname, '..'));
    expect(registry).not.toHaveProperty('mock');
    expect(registry).not.toHaveProperty('legacy');
  });
});

describe('getRegistry / resetRegistryCache — mémoïsation (un seul scan disque par dossier)', () => {
  beforeEach(() => resetRegistryCache());
  afterEach(() => resetRegistryCache());

  test('renvoie la même référence d\'objet à des appels successifs', () => {
    const dir = path.join(FIXTURES, 'scenario-valid');
    const first = getRegistry(dir);
    const second = getRegistry(dir);
    expect(second).toBe(first); // === , pas juste toEqual : preuve qu'aucun rechargement n'a eu lieu
  });

  test('n\'appelle fs.readdirSync qu\'une seule fois pour un dossier donné, quel que soit le nombre d\'appels', () => {
    const dir = path.join(FIXTURES, 'scenario-valid');
    const spy = jest.spyOn(fs, 'readdirSync');
    getRegistry(dir);
    getRegistry(dir);
    getRegistry(dir);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('resetRegistryCache() force un nouveau scan au prochain appel', () => {
    const dir = path.join(FIXTURES, 'scenario-valid');
    const spy = jest.spyOn(fs, 'readdirSync');
    getRegistry(dir);
    resetRegistryCache();
    getRegistry(dir);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  test('deux dossiers différents ont des entrées de cache indépendantes (pas de collision)', () => {
    const validRegistry = getRegistry(path.join(FIXTURES, 'scenario-valid'));
    // scenario-missing-key contient un Provider invalide : s'il partageait une entrée de cache
    // avec scenario-valid, on n'obtiendrait à tort ni la bonne erreur ni le bon registre.
    expect(() => getRegistry(path.join(FIXTURES, 'scenario-missing-key'))).toThrow(ProviderContractError);
    expect(validRegistry).toEqual({ mock: expect.anything(), legacy: expect.anything() });
  });

  test('un chemin relatif et son équivalent absolu partagent la même entrée de cache', () => {
    const abs = path.join(FIXTURES, 'scenario-valid');
    const rel = path.relative(process.cwd(), abs);
    expect(getRegistry(abs)).toBe(getRegistry(rel));
  });
});
