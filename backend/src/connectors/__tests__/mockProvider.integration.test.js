/**
 * Test d'intégration du socle : registre + Mock Provider + capacités + santé +
 * withProviderCall, assemblés bout en bout comme le ferait un futur Provider réel
 * (TikTok, Phase 3) — sans aucun appel réseau ni base de données.
 *
 * Utilise volontairement provider.getCapabilities()/provider.getHealth() (jamais
 * grantedCapabilities()/computeHealth() en direct) : c'est exactement l'interface que
 * le cœur applicatif est censé appeler, qu'il s'agisse du défaut attaché par le registre
 * ou d'une surcharge fournie par le Provider (contrat OAuth v1.0, point 3).
 */
const path = require('path');
const { loadRegistry } = require('../registry');
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

  test('le registre attache getCapabilities/getHealth même si le Provider ne les définit pas', () => {
    expect(typeof mock.getCapabilities).toBe('function');
    expect(typeof mock.getHealth).toBe('function');
  });

  test('cycle OAuth complet simulé : start → exchange → chiffrement → profil', async () => {
    const { authorizationUrl } = mock.auth.startAuthorization({ state: 'state-123', codeChallenge: 'challenge-456' });
    expect(authorizationUrl).toContain('state-123');

    const tokenSet = await mock.auth.exchangeAuthorizationCode('auth-code', { codeVerifier: 'verifier-456' });
    expect(tokenSet.accessToken).toBeTruthy();

    // Les tokens sont chiffrés avant d'imaginer un stockage (Phase 3 le fera réellement),
    // avec un AAD liant le ciphertext à son compte (§05 du contrat de référence).
    const encAccess = encrypt(tokenSet.accessToken, KEY, 'user-1:mock:mock-user-1');
    expect(decrypt(encAccess, KEY, 'user-1:mock:mock-user-1')).toBe(tokenSet.accessToken);
    expect(() => decrypt(encAccess, KEY, 'user-1:mock:AUTRE-compte')).toThrow();

    const profile = await mock.fetchProfile(tokenSet.accessToken);
    expect(profile.externalId).toBe('mock-user-1');
  });

  test('capacités accordées calculées via provider.getCapabilities (défaut générique lié au manifest)', async () => {
    const tokenSet = await mock.auth.exchangeAuthorizationCode('auth-code', { codeVerifier: 'verifier' });
    const granted = mock.getCapabilities(tokenSet.grantedScopes);
    expect(granted).toEqual(expect.arrayContaining(['profile', 'videos']));
    expect(granted).not.toContain('publish'); // scope mock.publish jamais demandé/accordé ici
  });

  test('santé "connected" via provider.getHealth (défaut générique lié au manifest)', async () => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString() };
    await expect(mock.getHealth(account)).resolves.toBe('connected');
  });

  test('un refresh qui échoue est classé et journalisé via withProviderCall', async () => {
    const logEvent = jest.fn().mockResolvedValue(undefined);
    const recordError = jest.fn().mockResolvedValue(undefined);
    const withProviderCall = createProviderCallWrapper({ logEvent, recordError, logger: { error: jest.fn() } });

    await expect(
      withProviderCall('mock', 'acc-1', 'refresh', () => mock.auth.refreshAccessToken('__expired__'))
    ).rejects.toThrow();

    expect(recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'REFRESH_FAILED' }));

    // La santé calculée après cet échec doit refléter refresh_failed, sans que le cœur
    // applicatif ait eu besoin de connaître un seul détail de l'API "mock".
    const accountAfterFailure = { status: 'active', lastError: { code: 'REFRESH_FAILED' } };
    await expect(mock.getHealth(accountAfterFailure)).resolves.toBe('refresh_failed');
  });

  test('un fetchProfile rate-limited est classé rate_limited de bout en bout', async () => {
    const recordError = jest.fn().mockResolvedValue(undefined);
    const withProviderCall = createProviderCallWrapper({ recordError, logger: { error: jest.fn() } });

    await expect(
      withProviderCall('mock', 'acc-2', 'sync_profile', () => mock.fetchProfile('__rate_limited__'))
    ).rejects.toThrow();

    expect(recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'RATE_LIMITED' }));
  });

  test('revokeAccess() ne throw jamais, même appelé n\'importe comment (contrat best-effort)', async () => {
    await expect(mock.auth.revokeAccess('n\'importe quoi')).resolves.toBeUndefined();
  });

  test('un refreshAccessToken réussi renvoie un refresh token à re-persister (rotation)', async () => {
    const fresh = await mock.auth.refreshAccessToken('old-refresh-token');
    expect(fresh.refreshToken).toBeDefined();
    expect(fresh.accessToken).not.toBe('old-refresh-token');
  });

  test('les tâches déclarées dans manifest.tasks sont bien exécutables', async () => {
    expect(mock.manifest.tasks).toContain('syncProfile');
    const result = await mock.tasks.syncProfile({ accessToken: 'mock-token' });
    expect(result.externalId).toBe('mock-user-1');
  });
});
