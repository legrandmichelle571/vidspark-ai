const config = require('../config');
const { startAuthorization, exchangeAuthorizationCode, refreshAccessToken, revokeAccess, normalizeTokenResponse } = require('../oauth');

function mockFetchJson(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300, status, statusText: '', json: async () => body
  });
}

describe('oauth.js — cycle OAuth TikTok (contrat de référence)', () => {
  beforeEach(() => {
    process.env.TIKTOK_CLIENT_KEY = 'test-client-key';
    process.env.TIKTOK_CLIENT_SECRET = 'test-client-secret';
  });
  afterEach(() => {
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;
    jest.restoreAllMocks();
    delete global.fetch;
  });

  describe('startAuthorization', () => {
    test('construit une URL avec state, code_challenge et scopes demandés — aucun appel réseau', () => {
      global.fetch = jest.fn(); // ne doit jamais être appelé
      const { authorizationUrl } = startAuthorization({
        state: 'state-abc', codeChallenge: 'challenge-xyz',
        redirectUri: 'https://vidsparkpro.com/api/connections/tiktok/callback',
        requestedScopes: ['user.info.basic']
      });
      expect(authorizationUrl).toContain(config.ENDPOINTS.authorize);
      expect(authorizationUrl).toContain('state=state-abc');
      expect(authorizationUrl).toContain('code_challenge=challenge-xyz');
      expect(authorizationUrl).toContain('code_challenge_method=S256');
      expect(authorizationUrl).toContain(encodeURIComponent('user.info.basic'));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('gère requestedScopes absent (scope vide dans l\'URL, pas un crash)', () => {
      const { authorizationUrl } = startAuthorization({ state: 's', codeChallenge: 'c', redirectUri: 'r' });
      expect(authorizationUrl).toContain('scope=');
    });

    test('lève CONFIG_ERROR si client_key/secret manquants — sans appel réseau', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      global.fetch = jest.fn();
      expect(() => startAuthorization({ state: 's', codeChallenge: 'c', redirectUri: 'r', requestedScopes: [] }))
        .toThrow(expect.objectContaining({ code: 'CONFIG_ERROR' }));
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('exchangeAuthorizationCode', () => {
    test('normalise la réponse brute TikTok (snake_case) en NormalizedTokenSet', async () => {
      mockFetchJson(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 86400, scope: 'user.info.basic,video.list' });
      const tokenSet = await exchangeAuthorizationCode('auth-code', { codeVerifier: 'v', redirectUri: 'r' });
      expect(tokenSet).toEqual({
        accessToken: 'AT', refreshToken: 'RT', expiresIn: 86400, grantedScopes: ['user.info.basic', 'video.list']
      });
    });

    test('envoie code_verifier et redirect_uri au token endpoint', async () => {
      mockFetchJson(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 3600, scope: '' });
      await exchangeAuthorizationCode('auth-code', { codeVerifier: 'verifier-1', redirectUri: 'https://x/callback' });
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(config.ENDPOINTS.token);
      expect(options.body).toContain('code_verifier=verifier-1');
      expect(options.body).toContain(encodeURIComponent('https://x/callback'));
    });

    test('lève INVALID_GRANT si TikTok renvoie error=invalid_grant', async () => {
      mockFetchJson(200, { error: 'invalid_grant', error_description: 'code déjà utilisé' });
      await expect(exchangeAuthorizationCode('code-brule', { codeVerifier: 'v', redirectUri: 'r' }))
        .rejects.toMatchObject({ code: 'INVALID_GRANT' });
    });

    test('lève UNKNOWN pour une erreur OAuth TikTok autre que invalid_grant', async () => {
      mockFetchJson(200, { error: 'invalid_request', error_description: 'redirect_uri invalide' });
      await expect(exchangeAuthorizationCode('code', { codeVerifier: 'v', redirectUri: 'r' }))
        .rejects.toMatchObject({ code: 'UNKNOWN', message: 'redirect_uri invalide' });
    });

    test('utilise le code d\'erreur brut comme message si error_description est absent', async () => {
      mockFetchJson(200, { error: 'invalid_request' });
      await expect(exchangeAuthorizationCode('code', { codeVerifier: 'v', redirectUri: 'r' }))
        .rejects.toMatchObject({ message: 'invalid_request' });
    });

    test('fonctionne même sans contexte fourni (codeVerifier/redirectUri undefined)', async () => {
      mockFetchJson(200, { access_token: 'AT', refresh_token: 'RT', expires_in: 100, scope: '' });
      await expect(exchangeAuthorizationCode('code')).resolves.toMatchObject({ accessToken: 'AT' });
    });

    test('propage un code HttpError (ex: SERVER_ERROR) sans le masquer', async () => {
      mockFetchJson(503, { error: 'internal' });
      await expect(exchangeAuthorizationCode('code', { codeVerifier: 'v', redirectUri: 'r' }))
        .rejects.toMatchObject({ code: 'SERVER_ERROR' });
    });
  });

  describe('refreshAccessToken', () => {
    test('renvoie un NOUVEAU refresh_token à re-persister (rotation)', async () => {
      mockFetchJson(200, { access_token: 'AT2', refresh_token: 'RT2-NOUVEAU', expires_in: 86400, scope: 'user.info.basic' });
      const tokenSet = await refreshAccessToken('RT-ANCIEN');
      expect(tokenSet.refreshToken).toBe('RT2-NOUVEAU');
      expect(tokenSet.refreshToken).not.toBe('RT-ANCIEN');
    });

    test('lève INVALID_GRANT si le refresh token est révoqué côté TikTok', async () => {
      mockFetchJson(200, { error: 'invalid_grant', error_description: 'refresh token révoqué' });
      await expect(refreshAccessToken('RT-revoque')).rejects.toMatchObject({ code: 'INVALID_GRANT' });
    });
  });

  describe('revokeAccess', () => {
    test('ne throw JAMAIS, même si TikTok renvoie une erreur', async () => {
      mockFetchJson(500, { error: 'internal' });
      await expect(revokeAccess('some-token')).resolves.toBeUndefined();
    });

    test('ne throw jamais non plus sur une panne réseau complète', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(revokeAccess('some-token')).resolves.toBeUndefined();
    });
  });

  describe('résilience — aucun retry sur exchange/refresh (contrat §09)', () => {
    test('exchangeAuthorizationCode n\'appelle fetch qu\'une seule fois, même en cas d\'échec réseau', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(exchangeAuthorizationCode('code', { codeVerifier: 'v', redirectUri: 'r' })).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('refreshAccessToken n\'appelle fetch qu\'une seule fois, même en cas d\'échec réseau', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(refreshAccessToken('rt')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
