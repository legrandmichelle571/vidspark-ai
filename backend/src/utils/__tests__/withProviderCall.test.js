const { createProviderCallWrapper, classifyError, KNOWN_ERROR_CODES } = require('../withProviderCall');

function makeDeps(overrides = {}) {
  return {
    logEvent: jest.fn().mockResolvedValue(undefined),
    recordError: jest.fn().mockResolvedValue(undefined),
    logger: { error: jest.fn() },
    ...overrides
  };
}

describe('classifyError', () => {
  test.each([...KNOWN_ERROR_CODES])('reconnaît le code connu "%s"', (code) => {
    const err = new Error('boom'); err.code = code;
    expect(classifyError(err)).toBe(code);
  });

  test('renvoie UNKNOWN pour un code non reconnu', () => {
    const err = new Error('boom'); err.code = 'SOMETHING_RANDOM';
    expect(classifyError(err)).toBe('UNKNOWN');
  });

  test('renvoie UNKNOWN si aucun code n\'est attaché', () => {
    expect(classifyError(new Error('boom'))).toBe('UNKNOWN');
  });

  test('déduit RATE_LIMITED d\'un status HTTP 429 (HttpError)', () => {
    const err = new Error('too many requests'); err.status = 429;
    expect(classifyError(err)).toBe('RATE_LIMITED');
  });
});

describe('withProviderCall (succès)', () => {
  test('renvoie le résultat de fn() et journalise un événement "_success"', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);
    const result = await withProviderCall('mock', 'acc-1', 'refresh', async () => 'ok-value');

    expect(result).toBe('ok-value');
    expect(deps.logEvent).toHaveBeenCalledWith({
      accountId: 'acc-1', platform: 'mock', eventType: 'refresh_success', detail: {}
    });
    expect(deps.recordError).not.toHaveBeenCalled();
    expect(deps.logger.error).not.toHaveBeenCalled();
  });

  test('fonctionne sans aucune dépendance injectée (no-op silencieux)', async () => {
    const withProviderCall = createProviderCallWrapper({});
    await expect(withProviderCall('mock', 'acc-1', 'refresh', async () => 42)).resolves.toBe(42);
  });

  test('fonctionne même appelé sans aucun argument (deps = {} par défaut)', async () => {
    const withProviderCall = createProviderCallWrapper();
    await expect(withProviderCall('mock', 'acc-1', 'refresh', async () => 1)).resolves.toBe(1);
  });
});

describe('withProviderCall (échec)', () => {
  test('propage l\'erreur d\'origine après journalisation', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);
    const boom = new Error('refresh token révoqué'); boom.code = 'REFRESH_FAILED';

    await expect(
      withProviderCall('tiktok', 'acc-2', 'refresh', async () => { throw boom; })
    ).rejects.toThrow('refresh token révoqué');
  });

  test('classe l\'erreur et met à jour last_error via recordError', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);
    const boom = new Error('quota dépassé'); boom.code = 'RATE_LIMITED';

    await expect(withProviderCall('tiktok', 'acc-3', 'sync', async () => { throw boom; })).rejects.toThrow();

    expect(deps.recordError).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'acc-3', code: 'RATE_LIMITED', message: 'quota dépassé'
    }));
  });

  test('journalise un événement "_error" avec le code classifié', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);
    const boom = new Error('scope refusé'); boom.code = 'MISSING_SCOPE';

    await expect(withProviderCall('tiktok', 'acc-4', 'oauth_exchange', async () => { throw boom; })).rejects.toThrow();

    expect(deps.logEvent).toHaveBeenCalledWith({
      accountId: 'acc-4', platform: 'tiktok', eventType: 'oauth_exchange_error',
      detail: { code: 'MISSING_SCOPE', message: 'scope refusé' }
    });
  });

  test('log console avec la convention [connections:<platform>:<event>]', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);
    await expect(withProviderCall('tiktok', 'acc-5', 'refresh', async () => { throw new Error('panne'); })).rejects.toThrow();

    expect(deps.logger.error).toHaveBeenCalledWith('[connections:tiktok:refresh] panne');
  });

  test('une erreur sans code connu est classée UNKNOWN mais journalisée quand même', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);
    await expect(withProviderCall('mock', 'acc-6', 'sync', async () => { throw new Error('mystère'); })).rejects.toThrow();

    expect(deps.recordError).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNKNOWN' }));
  });

  test('un Provider qui throw une valeur non-Error (sans .message) ne fait pas planter la classification', async () => {
    const deps = makeDeps();
    const withProviderCall = createProviderCallWrapper(deps);

    await expect(
      withProviderCall('mock', 'acc-10', 'sync', async () => { throw 'juste une chaîne'; })
    ).rejects.toBe('juste une chaîne');

    expect(deps.recordError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNKNOWN', message: 'juste une chaîne' })
    );
  });
});

describe('withProviderCall — la journalisation ne doit jamais masquer le résultat/l\'erreur réels', () => {
  // Régression trouvée pendant l'audit qualité : la première version appelait logEvent/recordError
  // SANS les isoler dans leur propre try/catch. Une panne de la couche de persistance (Supabase
  // indisponible, par exemple) faisait alors disparaître un résultat pourtant réussi, ou remplaçait
  // l'erreur métier réelle (ex: REFRESH_FAILED) par une erreur de journalisation sans rapport.

  test('un logEvent qui échoue en cas de SUCCÈS ne doit pas empêcher le résultat d\'être renvoyé', async () => {
    const logger = { error: jest.fn() };
    const logEvent = jest.fn().mockRejectedValue(new Error('DB indisponible'));
    const withProviderCall = createProviderCallWrapper({ logEvent, logger });

    const result = await withProviderCall('mock', 'acc-7', 'sync', async () => 'valeur-reelle');

    expect(result).toBe('valeur-reelle');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('logEvent(success) a échoué')
    );
  });

  test('un recordError qui échoue en cas d\'ÉCHEC ne doit pas remplacer l\'erreur métier d\'origine', async () => {
    const logger = { error: jest.fn() };
    const recordError = jest.fn().mockRejectedValue(new Error('DB indisponible'));
    const withProviderCall = createProviderCallWrapper({ recordError, logger });
    const businessError = new Error('refresh token révoqué côté TikTok');
    businessError.code = 'REFRESH_FAILED';

    await expect(
      withProviderCall('tiktok', 'acc-8', 'refresh', async () => { throw businessError; })
    ).rejects.toThrow('refresh token révoqué côté TikTok'); // pas "DB indisponible"

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('recordError a échoué'));
    expect(logger.error).toHaveBeenCalledWith('[connections:tiktok:refresh] refresh token révoqué côté TikTok');
  });

  test('un logEvent qui échoue en cas d\'ÉCHEC ne doit pas non plus remplacer l\'erreur métier', async () => {
    const logger = { error: jest.fn() };
    const logEvent = jest.fn().mockRejectedValue(new Error('DB indisponible'));
    const withProviderCall = createProviderCallWrapper({ logEvent, logger });
    const businessError = new Error('quota dépassé');
    businessError.code = 'RATE_LIMITED';

    await expect(
      withProviderCall('tiktok', 'acc-9', 'sync', async () => { throw businessError; })
    ).rejects.toThrow('quota dépassé');
  });
});
