// Fixture volontairement invalide : manifest.key absent — doit faire échouer loadRegistry().
module.exports = {
  label: 'Broken Provider',
  color: '#ff0000',
  icon: '💥',
  auth: { type: 'none' },
  capabilities: {},
  multiAccount: false
};
