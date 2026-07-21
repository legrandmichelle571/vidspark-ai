// Deux dossiers valides individuellement mais déclarant la même manifest.key ('dup') —
// doit faire échouer loadRegistry() avec un message de conflit explicite.
module.exports = {
  manifest: {
    key: 'dup', label: 'Duplicate A', color: '#000', icon: '🅰️',
    auth: { type: 'none' }, capabilities: {}, multiAccount: false
  }
};
