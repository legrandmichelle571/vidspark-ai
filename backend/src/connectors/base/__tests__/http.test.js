const { postForm, getJson, HttpError } = require('../http');

function mockFetchOnce(status, body, statusText = '') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body
  });
}

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('postForm', () => {
  test('envoie un corps x-www-form-urlencoded et renvoie le JSON', async () => {
    mockFetchOnce(200, { access_token: 'abc' });
    const result = await postForm('https://example.com/token', { grant_type: 'authorization_code', code: 'x' });
    expect(result).toEqual({ access_token: 'abc' });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://example.com/token');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(options.body).toContain('grant_type=authorization_code');
  });

  test('lève HttpError sur un statut d\'échec', async () => {
    mockFetchOnce(400, { error: 'invalid_grant' }, 'Bad Request');
    await expect(postForm('https://example.com/token', {})).rejects.toThrow(HttpError);
  });
});

describe('getJson', () => {
  test('envoie l\'en-tête Authorization: Bearer et renvoie le JSON', async () => {
    mockFetchOnce(200, { open_id: 'u1' });
    const result = await getJson('https://example.com/me', 'my-token');
    expect(result).toEqual({ open_id: 'u1' });
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  test('attache code=RATE_LIMITED sur un 429', async () => {
    mockFetchOnce(429, { error: 'rate limited' });
    try {
      await getJson('https://example.com/me', 'tok');
      throw new Error('aurait dû lever');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect(err.code).toBe('RATE_LIMITED');
      expect(err.status).toBe(429);
    }
  });

  test('ne plante pas si la réponse d\'erreur n\'est pas du JSON valide', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 500, statusText: 'Internal Server Error',
      json: async () => { throw new Error('not json'); }
    });
    await expect(getJson('https://example.com/me', 'tok')).rejects.toThrow(HttpError);
  });
});
