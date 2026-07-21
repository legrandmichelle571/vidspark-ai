const { postForm, getJson, fetchWithTimeout, withRetry, defaultIsRetryable, HttpError } = require('../http');

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

  test('attache code=SERVER_ERROR sur un 5xx (distinct de RATE_LIMITED)', async () => {
    mockFetchOnce(503, { error: 'unavailable' });
    try {
      await getJson('https://example.com/me', 'tok');
      throw new Error('aurait dû lever');
    } catch (err) {
      expect(err.code).toBe('SERVER_ERROR');
    }
  });

  test('n\'attache aucun code sur une erreur 4xx autre que 429 (pas de classification erronée)', async () => {
    mockFetchOnce(400, { error: 'bad_request' });
    try {
      await getJson('https://example.com/me', 'tok');
      throw new Error('aurait dû lever');
    } catch (err) {
      expect(err.code).toBeUndefined();
    }
  });
});

describe('fetchWithTimeout', () => {
  afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

  test('classe une AbortError (timeout) en err.code = TIMEOUT', async () => {
    global.fetch = jest.fn().mockImplementation((url, { signal } = {}) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; reject(e); });
    }));
    await expect(fetchWithTimeout('https://example.com', {}, 10)).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  test('classe toute autre exception fetch en err.code = NETWORK_ERROR', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    await expect(fetchWithTimeout('https://example.com', {}, 5000)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  test('renvoie la réponse normalement quand fetch réussit avant le timeout', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    await expect(fetchWithTimeout('https://example.com', {}, 5000)).resolves.toMatchObject({ ok: true });
  });
});

describe('withRetry — réservé aux appels idempotents (jamais exchange/refresh — voir contrat §09)', () => {
  test('renvoie le résultat immédiatement en cas de succès, sans retry', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retente une fois sur une erreur retryable (TIMEOUT/NETWORK_ERROR/SERVER_ERROR) puis réussit', async () => {
    const err = Object.assign(new Error('boom'), { code: 'TIMEOUT' });
    const fn = jest.fn().mockRejectedValueOnce(err).mockResolvedValueOnce('ok-apres-retry');
    await expect(withRetry(fn, { retries: 1, delayMs: 1 })).resolves.toBe('ok-apres-retry');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('ne retente JAMAIS une erreur non-retryable (ex: 4xx / MISSING_SCOPE)', async () => {
    const err = Object.assign(new Error('scope manquant'), { code: 'MISSING_SCOPE' });
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { retries: 3, delayMs: 1 })).rejects.toThrow('scope manquant');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('respecte la limite de tentatives (retries) et propage la dernière erreur', async () => {
    const err = Object.assign(new Error('toujours en panne'), { code: 'SERVER_ERROR' });
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { retries: 2, delayMs: 1 })).rejects.toThrow('toujours en panne');
    expect(fn).toHaveBeenCalledTimes(3); // 1 essai initial + 2 retries
  });

  test('defaultIsRetryable distingue les codes transitoires des erreurs définitives', () => {
    expect(defaultIsRetryable({ code: 'TIMEOUT' })).toBe(true);
    expect(defaultIsRetryable({ code: 'NETWORK_ERROR' })).toBe(true);
    expect(defaultIsRetryable({ code: 'SERVER_ERROR' })).toBe(true);
    expect(defaultIsRetryable({ code: 'RATE_LIMITED' })).toBe(false);
    expect(defaultIsRetryable({ code: 'MISSING_SCOPE' })).toBe(false);
    expect(defaultIsRetryable(new Error('sans code'))).toBe(false);
  });
});
