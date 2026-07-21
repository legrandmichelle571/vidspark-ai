/**
 * Mock Provider — implémentation canonique du contrat Provider, à usage de test uniquement.
 * Simule un cycle OAuth complet sans aucun appel réseau réel (pas de fetch), pour prouver que
 * le registre + les capacités + la santé + withProviderCall s'assemblent correctement.
 *
 * Noms de méthodes conformes au contrat OAuth figé (v1.0) : startAuthorization /
 * exchangeAuthorizationCode / refreshAccessToken / revokeAccess.
 */
const manifest = require('./manifest');

function startAuthorization({ state, codeChallenge } = {}) {
  return {
    authorizationUrl: `https://mock.example/oauth/authorize?state=${encodeURIComponent(state)}&challenge=${encodeURIComponent(codeChallenge || '')}`
  };
}

async function exchangeAuthorizationCode(code, _context) {
  if (code === '__invalid__') {
    const err = new Error('code invalide (simulation)');
    err.code = 'UNKNOWN';
    throw err;
  }
  return {
    accessToken: `mock-access-${code}`,
    refreshToken: `mock-refresh-${code}`,
    expiresIn: 3600,
    grantedScopes: ['mock.profile', 'mock.videos']
  };
}

async function refreshAccessToken(refreshTokenValue) {
  if (refreshTokenValue === '__expired__') {
    const err = new Error('refresh token révoqué côté plateforme (simulation)');
    err.code = 'REFRESH_FAILED';
    throw err;
  }
  return {
    accessToken: `mock-access-refreshed-${refreshTokenValue}`,
    refreshToken: refreshTokenValue,
    expiresIn: 3600,
    grantedScopes: ['mock.profile', 'mock.videos']
  };
}

async function revokeAccess(_accessToken) {
  // best-effort par contrat : ne throw jamais, quoi qu'il arrive
  return;
}

async function fetchProfile(accessToken) {
  if (accessToken === '__rate_limited__') {
    const err = new Error('quota dépassé (simulation)');
    err.code = 'RATE_LIMITED';
    throw err;
  }
  return {
    externalId: 'mock-user-1',
    externalName: '@mock_user',
    avatarUrl: 'https://mock.example/avatar.png'
  };
}

const tasks = {
  async syncProfile(account) {
    return fetchProfile(account.accessToken || 'mock-token');
  },
  async verifyScopes(account) {
    return { grantedScopes: account.grantedScopes || [] };
  }
};

module.exports = {
  manifest,
  auth: { startAuthorization, exchangeAuthorizationCode, refreshAccessToken, revokeAccess },
  fetchProfile,
  tasks
};
