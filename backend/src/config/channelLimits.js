/**
 * Nombre de chaînes YouTube autorisées par plan d'abonnement.
 * Gratuit / Pro = 1 chaîne, Business = 5 chaînes.
 */
const CHANNEL_LIMITS = {
  free:     1,
  pro:      1,
  business: 5
};

function getChannelLimit(plan) {
  return CHANNEL_LIMITS[(plan || 'free').toLowerCase()] || 1;
}

module.exports = { CHANNEL_LIMITS, getChannelLimit };
