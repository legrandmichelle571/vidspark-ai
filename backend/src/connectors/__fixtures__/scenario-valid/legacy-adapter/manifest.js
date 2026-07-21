/**
 * Fixture "adaptateur lecture seule" — même forme que le futur adaptateur YouTube (Phase 2) :
 * auth.type: 'none' (pas d'OAuth), profile disponible sans scope. Sert à prouver que le
 * registre et le contrat gèrent correctement les deux types d'auth ('oauth2' et 'none') sans
 * code spécifique à l'un ou l'autre.
 */
module.exports = {
  key: 'legacy',
  label: 'Legacy Adapter',
  color: '#607d8b',
  icon: '🗂️',
  auth: { type: 'none' },
  capabilities: {
    profile:   { supported: true },   // pas de scopes : auth.type !== 'oauth2'
    videos:    { supported: true },
    analytics: { supported: true },
    publish:   { supported: false },
    comments:  { supported: false },
    messages:  { supported: false },
    search:    { supported: false },
    webhook:   { supported: false }
  },
  multiAccount: true,
  tasks: ['syncProfile']
};
