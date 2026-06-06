/**
 * VidSpark AI — Paywall & Premium Features
 * ════════════════════════════════════════════════════════════════
 * Gère l'affichage premium pour les plans FREE/PRO/BUSINESS
 * - Blur des fonctionnalités premium
 * - Badges de plan
 * - Modal d'upgrade
 *
 * ⚠️  IMPORTANT: Plan definitions imported from plans.config.js
 */

// Importer la configuration des plans
// Si plans.config.js n'existe pas, utiliser les valeurs par défaut
const FEATURE_PLANS = typeof window !== 'undefined' && window.PLANS_CONFIG ? window.PLANS_CONFIG : {
  free: { limits: { max_channels: 1 } },
  pro: { limits: { max_channels: 1 } },
  business: { limits: { max_channels: 5 } }
};

const Paywall = {
  /**
   * Initialiser le paywall en fonction du plan utilisateur
   */
  init(userPlan) {
    console.log('[Paywall] Initializing for plan:', userPlan);

    switch(userPlan) {
      case 'pro':
        this.showPro();
        break;
      case 'business':
        this.showBusiness();
        break;
      case 'free':
      default:
        this.showFree();
        break;
    }
  },

  /**
   * Configuration des limites par fonctionnalité
   * ⚠️  IMPORTANT CORRECTION:
   * - multiChannel requires BUSINESS (not PRO!)
   * - PRO only has 1 channel, same as FREE
   */
  features: {
    analyze: { plan: 'free', name: 'Analyser' },
    aiReport: { plan: 'pro', name: 'Rapports IA' },
    aiTitles: { plan: 'business', name: 'Titres IA' },
    multiChannel: { plan: 'business', name: 'Plusieurs Chaînes' }  // ⚠️ FIXED: was 'pro', now 'business'
  },

  /**
   * Vérifier si une fonctionnalité est disponible
   */
  isFeatureAllowed(feature, userPlan) {
    const featureConfig = this.features[feature];
    if (!featureConfig) return false;

    const planHierarchy = { free: 0, pro: 1, business: 2 };
    const userLevel = planHierarchy[userPlan] || 0;
    const requiredLevel = planHierarchy[featureConfig.plan] || 0;

    return userLevel >= requiredLevel;
  },

  /**
   * Afficher le panneau FREE avec restrictions
   */
  showFree() {
    console.log('[Paywall] FREE plan - Showing restrictions');
    this.blurFeature('ai-report');
    this.blurFeature('ai-titles');
    this.blurFeature('multi-channel');

    this.addBadge('analyze-btn', 'FREE', '#22c55e');
  },

  /**
   * Afficher le panneau PRO
   */
  showPro() {
    console.log('[Paywall] PRO plan - Limited features');
    this.blurFeature('ai-titles');
    this.addBadge('analyze-btn', 'PRO', '#7c6dfa');
    this.addBadge('ai-report', 'PRO', '#7c6dfa');
  },

  /**
   * Afficher le panneau BUSINESS (accès complet)
   */
  showBusiness() {
    console.log('[Paywall] BUSINESS plan - Full access');
    this.addBadge('analyze-btn', 'BUSINESS', '#3b82f6');
    this.addBadge('ai-report', 'BUSINESS', '#3b82f6');
    this.addBadge('ai-titles', 'BUSINESS', '#3b82f6');
  },

  /**
   * Blur une fonctionnalité premium
   */
  blurFeature(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    console.log(`[Paywall] Blurring feature: ${elementId}`);

    // Appliquer les styles blur
    element.classList.add('paywall-locked');
    element.style.opacity = '0.5';
    element.style.filter = 'blur(3px)';
    element.style.pointerEvents = 'none';
    element.style.cursor = 'not-allowed';

    // Ajouter un overlay avec message
    const overlay = document.createElement('div');
    overlay.className = 'paywall-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 12px;
      z-index: 100;
      cursor: pointer;
      white-space: nowrap;
      border: 2px solid #00d4ff;
    `;
    overlay.textContent = '🔒 Upgrade to PRO/BUSINESS';
    overlay.onclick = () => this.showUpgradeModal();

    element.style.position = 'relative';
    element.appendChild(overlay);
  },

  /**
   * Ajouter un badge de plan à un élément
   */
  addBadge(elementId, planName, color) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const badge = document.createElement('span');
    badge.className = 'paywall-badge';
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: ${color};
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      z-index: 10;
    `;
    badge.textContent = planName;

    element.style.position = 'relative';
    element.appendChild(badge);
  },

  /**
   * Afficher le modal d'upgrade
   */
  showUpgradeModal() {
    console.log('[Paywall] Showing upgrade modal');

    // Masquer les modals existants
    const existingModal = document.getElementById('paywall-modal');
    if (existingModal) existingModal.remove();

    // Créer le modal
    const modal = document.createElement('div');
    modal.id = 'paywall-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #00d4ff;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      color: white;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    content.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 16px;">🚀</div>
      <h2 style="margin: 0 0 12px 0; color: #00d4ff; font-size: 24px;">Upgrade to PRO</h2>
      <p style="color: #8888a0; margin: 0 0 24px 0; line-height: 1.6;">
        Unlock unlimited AI analysis, reports, and more.
        <br><strong>$9.99/month</strong> or <strong>$29.99/month</strong> for Business
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <button onclick="window.open('https://vidsparkpro.com/pricing', '_blank')" style="
          background: #00d4ff;
          color: black;
          border: none;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        ">
          🔓 View Plans
        </button>
        <button onclick="document.getElementById('paywall-modal').remove()" style="
          background: transparent;
          color: #00d4ff;
          border: 2px solid #00d4ff;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        ">
          Later
        </button>
      </div>

      <p style="color: #666; font-size: 12px; margin: 0;">
        ⏰ Free tier reset every month on the 1st
      </p>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  /**
   * Ajouter un listener sur une action (analyse, rapport, etc)
   */
  protectFeature(buttonSelector, featureName, requiredPlan) {
    const button = document.querySelector(buttonSelector);
    if (!button) return;

    const originalOnClick = button.onclick;

    button.onclick = (e) => {
      const userPlan = window.VIDSPARK_USER_PLAN || 'free';

      if (!this.isFeatureAllowed(featureName, userPlan)) {
        console.log(`[Paywall] ${featureName} requires ${requiredPlan}, user has ${userPlan}`);
        e.preventDefault();
        this.showUpgradeModal();
        return false;
      }

      // Exécuter l'action originale
      if (originalOnClick) originalOnClick.call(button, e);
    };
  }
};

// Initialiser au démarrage
document.addEventListener('DOMContentLoaded', () => {
  const userPlan = window.VIDSPARK_USER_PLAN || 'free';
  Paywall.init(userPlan);
});

// Exporter pour utilisation dans content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Paywall;
}
