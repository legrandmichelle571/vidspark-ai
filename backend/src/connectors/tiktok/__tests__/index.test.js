const { manifest, auth, fetchProfile, tasks, getHealth } = require('../index');
const { assertValidProvider, OAUTH_METHODS } = require('../../base/contract');

describe('Provider TikTok — conformité au contrat OAuth de référence v1.0', () => {
  test('passe la validation générique du socle', () => {
    expect(() => assertValidProvider({ manifest, auth, fetchProfile, tasks, getHealth }, 'tiktok')).not.toThrow();
  });

  test('implémente les 4 méthodes OAuth figées, sous les noms définitifs', () => {
    for (const method of OAUTH_METHODS) {
      expect(typeof auth[method]).toBe('function');
    }
  });

  test('auth.type=oauth2, PKCE activé, scopes déclarés', () => {
    expect(manifest.auth.type).toBe('oauth2');
    expect(manifest.auth.pkce).toBe(true);
    expect(manifest.auth.scopesAvailable).toContain('user.info.basic');
  });

  test('analytics=false (limite réelle TikTok), videos/publish="planned" (pas encore exposés)', () => {
    expect(manifest.capabilities.analytics.supported).toBe(false);
    expect(manifest.capabilities.videos.supported).toBe('planned');
    expect(manifest.capabilities.publish.supported).toBe('planned');
  });
});

describe('getHealth — surcharge justifiée (point 3 du contrat)', () => {
  const ORIGINAL = { key: process.env.TIKTOK_CLIENT_KEY, secret: process.env.TIKTOK_CLIENT_SECRET };
  afterEach(() => {
    process.env.TIKTOK_CLIENT_KEY = ORIGINAL.key;
    process.env.TIKTOK_CLIENT_SECRET = ORIGINAL.secret;
  });

  test('config_error si les variables d\'environnement TikTok sont absentes', async () => {
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;
    await expect(getHealth({ status: 'active' })).resolves.toBe('config_error');
  });

  test('connected si les variables sont présentes et le compte valide', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'k';
    process.env.TIKTOK_CLIENT_SECRET = 's';
    await expect(getHealth({ status: 'active' })).resolves.toBe('connected');
  });

  test('disconnected si le compte est révoqué, indépendamment de la config', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'k';
    process.env.TIKTOK_CLIENT_SECRET = 's';
    await expect(getHealth({ status: 'revoked' })).resolves.toBe('disconnected');
  });

  test('respecte toujours le vocabulaire de errorCodes.js (aucune logique de santé dupliquée)', async () => {
    process.env.TIKTOK_CLIENT_KEY = 'k';
    process.env.TIKTOK_CLIENT_SECRET = 's';
    const account = { status: 'active', lastError: { code: 'INVALID_GRANT' } };
    await expect(getHealth(account)).resolves.toBe('refresh_failed');
  });
});

describe('Chargement via le registre réel — TikTok cohabite avec YouTube sans collision', () => {
  test('le vrai dossier connectors/ contient maintenant { tiktok, youtube }', () => {
    const path = require('path');
    const { loadRegistry } = require('../../registry');
    const registry = loadRegistry(path.join(__dirname, '..', '..'));
    expect(Object.keys(registry).sort()).toEqual(['tiktok', 'youtube']);
    expect(registry.tiktok.manifest.auth.type).toBe('oauth2');
    expect(registry.youtube.manifest.auth.type).toBe('none');
    // getCapabilities est bien attaché par défaut (TikTok ne le surcharge pas)
    expect(typeof registry.tiktok.getCapabilities).toBe('function');
    // getHealth ici est la SURCHARGE de TikTok, pas le défaut générique
    expect(registry.tiktok.getHealth).toBe(getHealth);
  });
});
