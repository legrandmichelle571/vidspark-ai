/**
 * Provider de référence pour tout futur Provider OAuth 2.0 (Instagram, Facebook, LinkedIn,
 * X, Twitch, Pinterest, Google…). Voir le contrat OAuth de référence pour la justification
 * de chaque choix ci-dessous.
 *
 * analytics: false — limite RÉELLE de l'API TikTok (Display API standard ne donne pas le
 * nombre d'abonnés/vues total ; nécessiterait la Business API, hors périmètre). videos et
 * publish restent 'planned' : accessibles via scope supplémentaire (video.list) ou API
 * dédiée (Content Posting API), non demandés en v1.
 */
module.exports = {
  key: 'tiktok',
  label: 'TikTok',
  color: '#000000',
  icon: '🎵',
  auth: {
    type: 'oauth2',
    supportsRefresh: true,
    pkce: true,
    scopesAvailable: ['user.info.basic', 'video.list', 'video.publish']
  },
  capabilities: {
    profile:   { supported: true,      scopes: ['user.info.basic'] },
    videos:    { supported: 'planned', scopes: ['video.list'] },
    analytics: { supported: false },
    publish:   { supported: 'planned', scopes: ['video.publish'] },
    comments:  { supported: false },
    messages:  { supported: false },
    search:    { supported: false },
    webhook:   { supported: false }
  },
  multiAccount: true,
  tasks: ['syncProfile', 'verifyScopes']
};
