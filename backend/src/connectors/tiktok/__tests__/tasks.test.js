const tasks = require('../tasks');

function mockFetchJson(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300, status, statusText: '', json: async () => body
  });
}

describe('tasks.syncProfile', () => {
  afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

  test('appelle fetchProfile via withProviderCall et journalise le succès', async () => {
    mockFetchJson(200, { data: { user: { open_id: 'oid-1', display_name: 'X' } } });
    const logEvent = jest.fn().mockResolvedValue(undefined);
    const result = await tasks.syncProfile(
      { id: 'acc-1', accessToken: 'tok' },
      { observability: { logEvent } }
    );
    expect(result.externalId).toBe('oid-1');
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ platform: 'tiktok', eventType: 'sync_profile_success' }));
  });

  test('un échec est classé et journalisé, jamais masqué', async () => {
    mockFetchJson(200, { error: { code: 'access_token_invalid', message: 'expiré' } });
    const recordError = jest.fn().mockResolvedValue(undefined);
    await expect(
      tasks.syncProfile({ id: 'acc-2', accessToken: 'bad' }, { observability: { recordError } })
    ).rejects.toThrow();
    expect(recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'REFRESH_FAILED' }));
  });
});

describe('tasks.verifyScopes', () => {
  test('renvoie les scopes connus via withProviderCall (aucun réseau)', async () => {
    global.fetch = jest.fn();
    const result = await tasks.verifyScopes({ id: 'acc-3', grantedScopes: ['user.info.basic'] });
    expect(result.grantedScopes).toEqual(['user.info.basic']);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
