const manifest = require('./manifest');

async function fetchProfile(_accessToken) {
  return { externalId: 'legacy-channel-1', externalName: 'Ma Chaîne', avatarUrl: null };
}

const tasks = {
  async syncProfile(account) {
    return fetchProfile(null);
  }
};

// Pas de bloc "auth" : conforme au contrat pour auth.type === 'none'.
module.exports = { manifest, fetchProfile, tasks };
