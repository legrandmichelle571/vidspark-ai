// Fixture volontairement invalide : auth.type='oauth2' mais aucune implémentation "auth" —
// doit faire échouer loadRegistry() (assertValidProvider).
module.exports = {
  key: 'brokenoauth',
  label: 'Broken OAuth Provider',
  color: '#ff0000',
  icon: '💥',
  auth: { type: 'oauth2', scopesAvailable: ['x'] },
  capabilities: {
    profile: { supported: false }
  },
  multiAccount: false
};
