const { fetchProfile, verifyScopes, mapTikTokErrorCode } = require('../api');

function mockFetchJson(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300, status, statusText: '', json: async () => body
  });
}

describe('fetchProfile', () => {
  afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

  test('traduit la réponse TikTok (data.user) en ExternalProfile normalisé', async () => {
    mockFetchJson(200, { data: { user: { open_id: 'oid-1', display_name: '@créateur', avatar_url: 'https://x/a.png' } } });
    const profile = await fetchProfile('access-token');
    expect(profile).toEqual({ externalId: 'oid-1', externalName: '@créateur', avatarUrl: 'https://x/a.png' });
  });

  test('utilise open_id comme externalName de repli si display_name absent', async () => {
    mockFetchJson(200, { data: { user: { open_id: 'oid-2' } } });
    const profile = await fetchProfile('token');
    expect(profile.externalName).toBe('oid-2');
  });

  test('classe une erreur TikTok applicative (ex: token invalide) via mapTikTokErrorCode', async () => {
    mockFetchJson(200, { error: { code: 'access_token_invalid', message: 'token expiré' } });
    await expect(fetchProfile('bad-token')).rejects.toMatchObject({ code: 'REFRESH_FAILED' });
  });

  test('ignore error.code="ok" (convention TikTok : succès malgré la présence du champ error)', async () => {
    mockFetchJson(200, { data: { user: { open_id: 'oid-4' } }, error: { code: 'ok', message: '' } });
    await expect(fetchProfile('token')).resolves.toMatchObject({ externalId: 'oid-4' });
  });

  test('fournit un message par défaut si error.message est absent', async () => {
    mockFetchJson(200, { error: { code: 'scope_not_authorized' } });
    await expect(fetchProfile('token')).rejects.toMatchObject({
      code: 'MISSING_SCOPE', message: 'Erreur API TikTok (user/info)'
    });
  });

  test('retente une fois sur une panne transitoire (idempotent, contrat §09)', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'FetchError' }))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { user: { open_id: 'oid-3' } } }) });
    const profile = await fetchProfile('token');
    expect(profile.externalId).toBe('oid-3');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('verifyScopes — meilleure valeur connue, PAS une introspection live (contrat §07)', () => {
  test('renvoie les scopes déjà connus du compte, sans appel réseau', async () => {
    global.fetch = jest.fn(); // ne doit jamais être appelé
    const result = await verifyScopes({ grantedScopes: ['user.info.basic'] });
    expect(result).toEqual({ grantedScopes: ['user.info.basic'], expiredScopes: [], refusedScopes: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('gère un compte sans grantedScopes sans planter', async () => {
    await expect(verifyScopes({})).resolves.toEqual({ grantedScopes: [], expiredScopes: [], refusedScopes: [] });
  });
});

describe('mapTikTokErrorCode', () => {
  test.each([
    ['access_token_invalid', 'REFRESH_FAILED'],
    ['scope_not_authorized', 'MISSING_SCOPE'],
    ['rate_limit_exceeded', 'RATE_LIMITED'],
    ['un_code_inconnu', 'UNKNOWN']
  ])('%s → %s', (tiktokCode, expected) => {
    expect(mapTikTokErrorCode(tiktokCode)).toBe(expected);
  });
});
