/**
 * Mock Provider — implémentation canonique du contrat Provider, à usage de test uniquement.
 * Simule un cycle OAuth complet sans aucun appel réseau réel (pas de fetch), pour prouver que
 * le registre + les capacités + la santé + withProviderCall s'assemblent correctement.
 *
 * Un flag interne (__forceError) permet aux tests de déclencher chaque branche d'erreur connue.
 */
const manifest = require('./manifest');

function getAuthUrl(state, codeVerifier) {
  return `https://mock.example/oauth/authorize?state=${encodeURIComponent(state)}&challenge=${encodeURIComponent(codeVerifier || '')}`;
}

async function exchangeCode(code, codeVerifier) {
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

async function refreshToken(refreshTokenValue) {
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

async function revoke(_accessToken) {
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
  auth: { getAuthUrl, exchangeCode, refreshToken, revoke },
  fetchProfile,
  tasks
};
