/**
 * Adaptateur YouTube — Phase 2. Ne traduit QUE ce qui existe déjà dans
 * activation_channels vers le contrat Provider générique. Pas d'OAuth (auth.type:'none') :
 * l'app n'a jamais demandé de jeton YouTube à l'utilisateur — voir routes/user.js et
 * routes/channels.js, inchangés.
 *
 * videos/analytics/publish sont marquées 'planned', PAS false : contrairement à TikTok
 * (limite réelle de la plateforme, voir manifest TikTok en Phase 3), YouTube EST capable
 * de tout ça — l'app le fait déjà via utils/youtube.js (clé API serveur, par vidéo/chaîne
 * à la demande). 'planned' signifie ici : « pas encore exposé à travers CE Provider »,
 * pas « impossible sur cette plateforme ». Les exposer réellement via ce Provider est un
 * choix de conception à faire en Phase 4 (routes), pas maintenant.
 */
module.exports = {
  key: 'youtube',
  label: 'YouTube',
  color: '#FF0000',
  icon: '▶️',
  auth: { type: 'none' },
  capabilities: {
    profile:   { supported: true },
    videos:    { supported: 'planned' },
    analytics: { supported: 'planned' },
    publish:   { supported: 'planned' },
    comments:  { supported: false },
    messages:  { supported: false },
    search:    { supported: false },
    webhook:   { supported: false }
  },
  multiAccount: true,
  tasks: ['syncProfile']
};
