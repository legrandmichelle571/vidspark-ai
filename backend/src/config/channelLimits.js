/**
 * Nombre de chaînes YouTube autorisées par plan d'abonnement.
 * Gratuit / Pro = 1 · Business = 5 · Diamant = 10.
 * Sert AUSSI de limite d'appareils (1 code ouvre N chaînes = N appareils max).
 */
const CHANNEL_LIMITS = {
  free:     1,
  pro:      1,
  business: 5,
  diamant:  10
};

function getChannelLimit(plan) {
  return CHANNEL_LIMITS[(plan || 'free').toLowerCase()] || 1;
}

module.exports = { CHANNEL_LIMITS, getChannelLimit };
