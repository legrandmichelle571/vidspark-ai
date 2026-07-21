const { computeHealth, HEALTH_STATES } = require('../health');

const oauthManifest = { auth: { type: 'oauth2' } };
const noneManifest = { auth: { type: 'none' } };

describe('computeHealth', () => {
  test('aucune ligne de compte → disconnected', () => {
    expect(computeHealth(null, oauthManifest)).toBe('disconnected');
  });

  test('status "revoked" → disconnected, même si le token semble encore valide', () => {
    const account = { status: 'revoked', tokenExpiresAt: new Date(Date.now() + 999999).toISOString() };
    expect(computeHealth(account, oauthManifest)).toBe('disconnected');
  });

  test('token expiré → expired_token', () => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() - 1000).toISOString() };
    expect(computeHealth(account, oauthManifest)).toBe('expired_token');
  });

  test('accepte tokenExpiresAt comme instance Date (pas seulement une chaîne ISO)', () => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() - 1000) };
    expect(computeHealth(account, oauthManifest)).toBe('expired_token');
  });

  test('token valide, aucune erreur → connected', () => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() + 999999).toISOString() };
    expect(computeHealth(account, oauthManifest)).toBe('connected');
  });

  test.each([
    ['RATE_LIMITED', 'rate_limited'],
    ['MISSING_SCOPE', 'missing_scope'],
    ['REFRESH_FAILED', 'refresh_failed'],
    ['PROVIDER_DOWN', 'provider_unavailable'],
    ['PROVIDER_UNAVAILABLE', 'provider_unavailable']
  ])('lastError.code=%s → %s', (code, expected) => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() + 999999).toISOString(), lastError: { code } };
    expect(computeHealth(account, oauthManifest)).toBe(expected);
  });

  test('un code d\'erreur inconnu ne fait pas planter et retombe sur connected', () => {
    const account = { status: 'active', tokenExpiresAt: new Date(Date.now() + 999999).toISOString(), lastError: { code: 'SOMETHING_ELSE' } };
    expect(computeHealth(account, oauthManifest)).toBe('connected');
  });

  test('config_error si hasRequiredEnvVars renvoie false pour un Provider oauth2', () => {
    const account = { status: 'active' };
    const health = computeHealth(account, oauthManifest, { hasRequiredEnvVars: () => false });
    expect(health).toBe('config_error');
  });

  test('hasRequiredEnvVars n\'est jamais consulté pour un Provider auth.type="none"', () => {
    const hasRequiredEnvVars = jest.fn(() => false);
    const account = { status: 'active' };
    const health = computeHealth(account, noneManifest, { hasRequiredEnvVars });
    expect(hasRequiredEnvVars).not.toHaveBeenCalled();
    expect(health).toBe('connected');
  });

  test('account sans tokenExpiresAt (ex: auth.type="none") ne déclenche jamais expired_token', () => {
    const account = { status: 'active' };
    expect(computeHealth(account, noneManifest)).toBe('connected');
  });

  test('now() injectable pour des tests déterministes', () => {
    const fixedNow = new Date('2026-01-01T00:00:00Z').getTime();
    const account = { status: 'active', tokenExpiresAt: '2025-12-31T23:59:59Z' };
    expect(computeHealth(account, oauthManifest, { now: () => fixedNow })).toBe('expired_token');
  });

  test('HEALTH_STATES liste exactement les 8 états attendus', () => {
    expect(HEALTH_STATES).toEqual([
      'connected', 'disconnected', 'expired_token', 'refresh_failed',
      'missing_scope', 'rate_limited', 'config_error', 'provider_unavailable'
    ]);
  });

  test('un tokenExpiresAt corrompu (date invalide) ne fait pas planter et ne déclenche pas expired_token', () => {
    const account = { status: 'active', tokenExpiresAt: 'ceci-n-est-pas-une-date' };
    expect(() => computeHealth(account, oauthManifest)).not.toThrow();
    expect(computeHealth(account, oauthManifest)).toBe('connected');
  });

  test('INVALID_GRANT (spécifique OAuth) est mappé sur refresh_failed, pas ignoré silencieusement', () => {
    // Régression : avant la consolidation dans connectors/base/errorCodes.js, ce code était
    // reconnu par withProviderCall.js mais absent de la table locale de health.js — un compte
    // avec un refresh token invalide s'affichait donc "connected" au lieu de "refresh_failed".
    const account = { status: 'active', lastError: { code: 'INVALID_GRANT' } };
    expect(computeHealth(account, oauthManifest)).toBe('refresh_failed');
  });
});
