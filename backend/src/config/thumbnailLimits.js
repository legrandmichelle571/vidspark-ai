/**
 * Quota MENSUEL de génération de miniatures par plan.
 * Gratuit = 0 (bloqué), Pro = 30/mois, Business = 50/mois, Diamant = 100/mois.
 */
const THUMBNAIL_LIMITS = {
  free:     0,
  pro:      30,
  business: 50,
  diamant:  100
};

function getThumbnailLimit(plan) {
  return THUMBNAIL_LIMITS[(plan || 'free').toLowerCase()] || 0;
}

module.exports = { THUMBNAIL_LIMITS, getThumbnailLimit };
