const { assertValidManifest, assertValidProvider, ProviderContractError, RECOGNIZED_CAPABILITIES } = require('../contract');

function baseManifest(overrides = {}) {
  return {
    key: 'sample',
    label: 'Sample',
    color: '#123456',
    icon: '🧩',
    auth: { type: 'oauth2', scopesAvailable: ['a'] },
    capabilities: {
      profile: { supported: true, scopes: ['a'] }
    },
    multiAccount: true,
    ...overrides
  };
}

describe('assertValidManifest', () => {
  test('accepte un manifest valide', () => {
    expect(() => assertValidManifest(baseManifest())).not.toThrow();
  });

  test('rejette un manifest sans key', () => {
    const m = baseManifest(); delete m.key;
    expect(() => assertValidManifest(m, 'x')).toThrow(ProviderContractError);
  });

  test('rejette une key en majuscules', () => {
    expect(() => assertValidManifest(baseManifest({ key: 'TikTok' }))).toThrow(/minuscules/);
  });

  test('rejette un manifest null/undefined/non-objet', () => {
    expect(() => assertValidManifest(null, 'x')).toThrow(/manquant ou invalide/);
    expect(() => assertValidManifest(undefined, 'x')).toThrow(/manquant ou invalide/);
    expect(() => assertValidManifest('pas un objet', 'x')).toThrow(/manquant ou invalide/);
  });

  test('rejette un manifest sans label', () => {
    const m = baseManifest(); delete m.label;
    expect(() => assertValidManifest(m, 'x')).toThrow(/label manquant/);
  });

  test('rejette un manifest sans capabilities', () => {
    const m = baseManifest(); delete m.capabilities;
    expect(() => assertValidManifest(m, 'x')).toThrow(/capabilities manquant/);
  });

  test('rejette un auth.type invalide', () => {
    expect(() => assertValidManifest(baseManifest({ auth: { type: 'basic' } }))).toThrow(/auth\.type/);
  });

  test('accepte auth.type "none"', () => {
    const m = baseManifest({ auth: { type: 'none' }, capabilities: { profile: { supported: true } } });
    expect(() => assertValidManifest(m)).not.toThrow();
  });

  test('rejette une capacité inconnue', () => {
    const m = baseManifest({ capabilities: { flying: { supported: true, scopes: ['a'] } } });
    expect(() => assertValidManifest(m)).toThrow(/inconnue/);
  });

  test.each(RECOGNIZED_CAPABILITIES)('accepte la capacité reconnue "%s"', (cap) => {
    const m = baseManifest({ capabilities: { [cap]: { supported: false } } });
    expect(() => assertValidManifest(m)).not.toThrow();
  });

  test('rejette supported avec une valeur hors {true,false,"planned"}', () => {
    const m = baseManifest({ capabilities: { profile: { supported: 'yes' } } });
    expect(() => assertValidManifest(m)).toThrow(/true, false ou "planned"/);
  });

  test('rejette une capacité oauth2 supportée sans scopes', () => {
    const m = baseManifest({ capabilities: { profile: { supported: true } } });
    expect(() => assertValidManifest(m)).toThrow(/scope/);
  });

  test('rejette multiAccount non booléen', () => {
    const m = baseManifest({ multiAccount: 'yes' });
    expect(() => assertValidManifest(m)).toThrow(/multiAccount/);
  });
});

describe('assertValidProvider', () => {
  test('accepte un Provider oauth2 complet', () => {
    const provider = {
      manifest: baseManifest(),
      auth: { startAuthorization: () => ({authorizationUrl:''}), exchangeAuthorizationCode: async () => ({}), refreshAccessToken: async () => ({}), revokeAccess: async () => {} },
      fetchProfile: async () => ({})
    };
    expect(() => assertValidProvider(provider)).not.toThrow();
  });

  test('rejette un Provider oauth2 sans bloc auth', () => {
    const provider = { manifest: baseManifest(), fetchProfile: async () => ({}) };
    expect(() => assertValidProvider(provider)).toThrow(/aucune implémentation "auth"/);
  });

  test('rejette un Provider avec une méthode auth manquante', () => {
    const provider = {
      manifest: baseManifest(),
      auth: { startAuthorization: () => ({authorizationUrl:''}), exchangeAuthorizationCode: async () => ({}), refreshAccessToken: async () => ({}) }, // revokeAccess manquant
      fetchProfile: async () => ({})
    };
    expect(() => assertValidProvider(provider)).toThrow(/auth\.revokeAccess/);
  });

  test('rejette profile supporté sans fetchProfile exporté', () => {
    const provider = {
      manifest: baseManifest(),
      auth: { startAuthorization: () => ({authorizationUrl:''}), exchangeAuthorizationCode: async () => ({}), refreshAccessToken: async () => ({}), revokeAccess: async () => {} }
      // fetchProfile manquant
    };
    expect(() => assertValidProvider(provider)).toThrow(/fetchProfile/);
  });

  test('rejette une tâche déclarée dans manifest.tasks mais absente de tasks{}', () => {
    const provider = {
      manifest: baseManifest({ tasks: ['syncProfile'] }),
      auth: { startAuthorization: () => ({authorizationUrl:''}), exchangeAuthorizationCode: async () => ({}), refreshAccessToken: async () => ({}), revokeAccess: async () => {} },
      fetchProfile: async () => ({}),
      tasks: {}
    };
    expect(() => assertValidProvider(provider)).toThrow(/syncProfile/);
  });

  test('accepte un Provider auth.type "none" sans bloc auth', () => {
    const provider = {
      manifest: baseManifest({ auth: { type: 'none' }, capabilities: { profile: { supported: true } } }),
      fetchProfile: async () => ({})
    };
    expect(() => assertValidProvider(provider)).not.toThrow();
  });

  test('rejette un export qui n\'est pas un objet', () => {
    expect(() => assertValidProvider(null, 'x')).toThrow(ProviderContractError);
    expect(() => assertValidProvider(42, 'x')).toThrow(ProviderContractError);
  });

  test('accepte un Provider sans getCapabilities/getHealth (défauts attachés par le registre, pas ici)', () => {
    const provider = { manifest: baseManifest({ auth: { type: 'none' } }), fetchProfile: async () => ({}) };
    expect(() => assertValidProvider(provider)).not.toThrow();
  });

  test('accepte getCapabilities/getHealth quand ce sont des fonctions (surcharge explicite)', () => {
    const provider = {
      manifest: baseManifest({ auth: { type: 'none' } }),
      fetchProfile: async () => ({}),
      getCapabilities: () => ({}),
      getHealth: async () => 'connected'
    };
    expect(() => assertValidProvider(provider)).not.toThrow();
  });

  test('rejette getCapabilities si présent mais pas une fonction', () => {
    const provider = { manifest: baseManifest({ auth: { type: 'none' } }), fetchProfile: async () => ({}), getCapabilities: 'oups' };
    expect(() => assertValidProvider(provider)).toThrow(/getCapabilities.*doit être une fonction/);
  });

  test('rejette getHealth si présent mais pas une fonction', () => {
    const provider = { manifest: baseManifest({ auth: { type: 'none' } }), fetchProfile: async () => ({}), getHealth: 42 };
    expect(() => assertValidProvider(provider)).toThrow(/getHealth.*doit être une fonction/);
  });
});
