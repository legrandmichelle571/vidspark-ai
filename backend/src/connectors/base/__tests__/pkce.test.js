const crypto = require('crypto');
const { buildPkcePair, generateState } = require('../pkce');

function base64urlDecode(str) {
  return str.replace(/-/g, '+').replace(/_/g, '/');
}

describe('buildPkcePair', () => {
  test('codeChallenge = base64url(sha256(codeVerifier)) — vérifiable indépendamment (RFC 7636 S256)', () => {
    const { codeVerifier, codeChallenge } = buildPkcePair();
    const expected = crypto.createHash('sha256').update(codeVerifier).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(codeChallenge).toBe(expected);
  });

  test('codeVerifier respecte la longueur RFC 7636 (43 à 128 caractères)', () => {
    const { codeVerifier } = buildPkcePair();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);
  });

  test('ne contient aucun caractère hors alphabet base64url (pas de +, /, =)', () => {
    const { codeVerifier, codeChallenge } = buildPkcePair();
    expect(codeVerifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(codeChallenge).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  test('génère une paire différente à chaque appel', () => {
    const a = buildPkcePair();
    const b = buildPkcePair();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
  });
});

describe('generateState', () => {
  test('génère une valeur non vide, en base64url', () => {
    const state = generateState();
    expect(state.length).toBeGreaterThan(20);
    expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  test('génère une valeur différente à chaque appel (usage unique)', () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateState()));
    expect(seen.size).toBe(50);
  });
});
