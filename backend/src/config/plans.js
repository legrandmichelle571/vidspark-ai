/**
 * VidSpark AI — Limites de plans
 * ═══════════════════════════════════════════════════════════════
 * SOURCE DE VÉRITÉ UNIQUE pour toutes les limites Free/Pro/Business.
 * Importé par : middleware/auth.js · routes/webhook.js · routes/user.js
 *
 * Ne pas dupliquer ces valeurs ailleurs.
 * ═══════════════════════════════════════════════════════════════
 */

const PLAN_LIMITS = {
  free: {
    daily_analyses: 10,   // analyses SEO / description / tags par jour
    daily_titles:   0,    // 0 = accès bloqué (requirePro)
    quota_limit:    10    // valeur stockée dans users.quota_limit
  },
  pro: {
    daily_analyses: 200,
    daily_titles:   100,
    quota_limit:    200
  },
  business: {
    daily_analyses: 1000,
    daily_titles:   500,
    quota_limit:    1000
  }
};

/**
 * Retourne les limites du plan.
 * Fallback sur Free si le plan est inconnu.
 * @param {string} plan
 * @returns {{ daily_analyses: number, daily_titles: number, quota_limit: number }}
 */
function getLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

module.exports = { PLAN_LIMITS, getLimits };
