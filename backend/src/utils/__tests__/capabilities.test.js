const { grantedCapabilities, declaredCapabilityStates } = require('../capabilities');

const manifest = {
  capabilities: {
    profile:   { supported: true,      scopes: ['p'] },
    videos:    { supported: true,      scopes: ['v1', 'v2'] },
    analytics: { supported: false },
    publish:   { supported: 'planned', scopes: ['pub'] }
  }
};

describe('grantedCapabilities', () => {
  test('renvoie une capacité supportée dont tous les scopes sont accordés', () => {
    expect(grantedCapabilities(manifest, ['p'])).toEqual(['profile']);
  });

  test('exclut une capacité si un seul des scopes requis manque', () => {
    expect(grantedCapabilities(manifest, ['v1'])).not.toContain('videos'); // v2 manquant
  });

  test('inclut une capacité multi-scopes si tous ses scopes sont accordés', () => {
    expect(grantedCapabilities(manifest, ['v1', 'v2'])).toContain('videos');
  });

  test('n\'inclut jamais une capacité supported:false, quels que soient les scopes accordés', () => {
    expect(grantedCapabilities(manifest, ['p', 'v1', 'v2', 'anything'])).not.toContain('analytics');
  });

  test('n\'inclut jamais une capacité supported:"planned"', () => {
    expect(grantedCapabilities(manifest, ['pub'])).not.toContain('publish');
  });

  test('sans scope accordé, renvoie un tableau vide', () => {
    expect(grantedCapabilities(manifest, [])).toEqual([]);
  });

  test('gère un manifest sans capabilities sans planter', () => {
    expect(grantedCapabilities({}, ['p'])).toEqual([]);
    expect(grantedCapabilities(null, ['p'])).toEqual([]);
  });

  test('grantedScopes est optionnel (défaut []) — un Provider auth.type="none" sans scopes fonctionne', () => {
    // cas réel de la fixture legacy-adapter : capabilities.profile.supported=true sans "scopes"
    const noneManifest = { capabilities: { profile: { supported: true } } };
    expect(grantedCapabilities(noneManifest)).toEqual(['profile']);
  });

  test('une capacité supportée sans tableau "scopes" est considérée accordée sans condition', () => {
    const m = { capabilities: { profile: { supported: true } } }; // pas de scopes du tout
    expect(grantedCapabilities(m, [])).toEqual(['profile']);
  });
});

describe('declaredCapabilityStates', () => {
  test('reflète l\'état déclaré de chaque capacité, indépendamment des scopes accordés', () => {
    expect(declaredCapabilityStates(manifest)).toEqual({
      profile: true, videos: true, analytics: false, publish: 'planned'
    });
  });

  test('gère un manifest vide sans planter', () => {
    expect(declaredCapabilityStates(null)).toEqual({});
  });

  test('traite une entrée de capacité null/undefined comme false plutôt que de planter', () => {
    const m = { capabilities: { profile: null } };
    expect(declaredCapabilityStates(m)).toEqual({ profile: false });
  });
});
