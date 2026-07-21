const config = require('../config');

describe('config — point unique de version/endpoints (contrat §08)', () => {
  const ORIGINAL = { key: process.env.TIKTOK_CLIENT_KEY, secret: process.env.TIKTOK_CLIENT_SECRET };
  afterEach(() => {
    process.env.TIKTOK_CLIENT_KEY = ORIGINAL.key;
    process.env.TIKTOK_CLIENT_SECRET = ORIGINAL.secret;
  });

  test('expose une seule version d\'API et un ensemble d\'endpoints figés', () => {
    expect(config.API_VERSION).toBe('v2');
    expect(Object.keys(config.ENDPOINTS).sort()).toEqual(['authorize', 'revoke', 'token', 'userInfo'].sort());
  });

  test('lit les identifiants depuis les variables d\'environnement, jamais en dur', () => {
    process.env.TIKTOK_CLIENT_KEY = 'abc';
    process.env.TIKTOK_CLIENT_SECRET = 'xyz';
    expect(config.clientKey()).toBe('abc');
    expect(config.clientSecret()).toBe('xyz');
  });

  test('hasRequiredEnvVars() reflète la présence des deux variables', () => {
    delete process.env.TIKTOK_CLIENT_KEY;
    delete process.env.TIKTOK_CLIENT_SECRET;
    expect(config.hasRequiredEnvVars()).toBe(false);

    process.env.TIKTOK_CLIENT_KEY = 'abc';
    expect(config.hasRequiredEnvVars()).toBe(false); // secret encore manquant

    process.env.TIKTOK_CLIENT_SECRET = 'xyz';
    expect(config.hasRequiredEnvVars()).toBe(true);
  });
});
