/**
 * Test d'intégration du socle : registre + Mock Provider + capacités + santé +
 * withProviderCall, assemblés bout en bout comme le ferait un futur Provider réel
 * (TikTok, Phase 3) — sans aucun appel réseau ni base de données.
 */
const path = require('path');
const { loadRegistry } = require('../registry');
const { grantedCapabilities } = require('../../utils/capabilities');
const { computeHealth } = require('../../utils/health');
const { createProviderCallWrapper } = require('../../utils/withProviderCall');
const { encrypt, decrypt, generateKey } = require('../../utils/tokenCrypto');

const FIXTURES = path.join(__dirname, '..', '__fixtures__', 'scenario-valid');
const KEY = generateKey();

describe('Mock Provider — bout en bout', () => {
  let registry, mock;

  beforeAll(() => {
    registry = loadRegistry(FIXTURES);
    mock = registry.mock;
  });

  test('le registre expose le Mock Provider sous sa manifest.key', () => {
    expect(mock).toBeDefined();
    expect(mock.manifest.key).toBe('mock');
  });

  test('cycle OAuth complet simulé : start → exchange → chiffrement → profil', async () => {
    const authUrl = mock.auth.getAuthUrl('state-123', 'verifier-456');
    expect(authUrl).toContain('state-123');

    const tokenSet = await mock.auth.exchangeCode('auth-code', 'verifier-456');
    expect(tokenSet.accessToken).toBeTruthy();

    // Les tokens sont chiffrés avant d'imaginer un stockage (Phase 3 le fera réellement)
    const encAccess = encrypt(tokenSet.accessToken, KEY);
    expect(decrypt(encAccess, KEY)).toBe(tokenSet.accessToken);

    const profile = await mock.fetchProfile(tokenSet.accessToken);
    expect(profile.externalId).toBe('mock-user-1');
  });

  test('capacités accordées calculées à partir des scopes réellement retournés', async () => {
    const tokenSet = await mock.auth.exchangeCode('auth-code', 'verifier');
    const granted = grantedCapabilities(mock.manifest, tokenSet.grantedScopes);
    expect(granted).toEqual(expect.arrayContaining(['profile', 'videos']));
    expect(granted).not.toContain('publish'); // scope mock.publish jamais demandé/accordé ici
  });

  test('santé "connected" pour un compte simulé valide', () => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString() };
    expect(computeHealth(account, mock.manifest)).toBe('connected');
  });

  test('un refresh qui échoue est classé et journalisé via withProviderCall', async () => {
    const logEvent = jest.fn().mockResolvedValue(undefined);
    const recordError = jest.fn().mockResolvedValue(undefined);
    const withProviderCall = createProviderCallWrapper({ logEvent, recordError, logger: { error: jest.fn() } });

    await expect(
      withProviderCall('mock', 'acc-1', 'refresh', () => mock.auth.refreshToken('__expired__'))
    ).rejects.toThrow();

    expect(recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'REFRESH_FAILED' }));

    // La santé calculée après cet échec doit refléter refresh_failed, sans que le cœur
    // applicatif ait eu besoin de connaître un seul détail de l'API "mock".
    const accountAfterFailure = { status: 'active', lastError: { code: 'REFRESH_FAILED' } };
    expect(computeHealth(accountAfterFailure, mock.manifest)).toBe('refresh_failed');
  });

  test('un fetchProfile rate-limited est classé rate_limited de bout en bout', async () => {
    const recordError = jest.fn().mockResolvedValue(undefined);
    const withProviderCall = createProviderCallWrapper({ recordError, logger: { error: jest.fn() } });

    await expect(
      withProviderCall('mock', 'acc-2', 'sync_profile', () => mock.fetchProfile('__rate_limited__'))
    ).rejects.toThrow();

    expect(recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'RATE_LIMITED' }));
  });

  test('revoke() ne throw jamais, même appelé n\'importe comment (contrat best-effort)', async () => {
    await expect(mock.auth.revoke('n\'importe quoi')).resolves.toBeUndefined();
  });

  test('les tâches déclarées dans manifest.tasks sont bien exécutables', async () => {
    expect(mock.manifest.tasks).toContain('syncProfile');
    const result = await mock.tasks.syncProfile({ accessToken: 'mock-token' });
    expect(result.externalId).toBe('mock-user-1');
  });
});
