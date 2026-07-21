/**
 * Manifest du Mock Provider — utilisé UNIQUEMENT par les tests unitaires du socle (registre,
 * capacités, santé, withProviderCall). Volontairement placé sous __fixtures__/, PAS dans
 * backend/src/connectors/, pour qu'il ne puisse jamais être découvert par le registre en
 * production, même une fois le module Providers activé.
 *
 * Couvre volontairement un mélange d'états (true/false/'planned') pour exercer tous les
 * chemins de utils/capabilities.js.
 */
module.exports = {
  key: 'mock',
  label: 'Mock Platform',
  color: '#888888',
  icon: '🧪',
  auth: {
    type: 'oauth2',
    supportsRefresh: true,
    pkce: true,
    scopesAvailable: ['mock.profile', 'mock.videos', 'mock.publish']
  },
  capabilities: {
    profile:   { supported: true,      scopes: ['mock.profile'] },
    videos:    { supported: true,      scopes: ['mock.videos'] },
    analytics: { supported: false },
    publish:   { supported: 'planned', scopes: ['mock.publish'] },
    comments:  { supported: false },
    messages:  { supported: false },
    search:    { supported: false },
    webhook:   { supported: false }
  },
  multiAccount: true,
  tasks: ['syncProfile', 'verifyScopes']
};
