/**
 * Routes d'activation de l'extension Chrome
 * POST /api/activation/activate          → valider ID + Secret
 * GET  /api/activation/remaining/:id     → vérifier la durée restante
 *
 * Les codes sont stockés dans la table `activation_codes`
 * (générés par POST /api/auth/google lors de la connexion au dashboard).
 */
const router = require('express').Router();

/* ── Valider ID + Secret (appelé par l'extension) ── */
router.post('/activate', async (req, res) => {
  try {
    const { activation_id, activation_secret } = req.body;

    if (!activation_id || !activation_secret) {
      return res.status(400).json({ error: 'ID et Secret requis' });
    }

    const supabase = req.app.locals.supabase;

    // Chercher le code dans activation_codes
    const { data: code, error: codeErr } = await supabase
      .from('activation_codes')
      .select('user_id, subscription_expiry')
      .eq('activation_id', activation_id)
      .eq('activation_secret', activation_secret)
      .maybeSingle();

    if (codeErr || !code) {
      return res.status(401).json({ error: 'ID ou Secret invalide' });
    }

    // Vérifier l'expiration
    const expiryDate = new Date(code.subscription_expiry);
    const now = new Date();
    if (expiryDate < now) {
      return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    }

    // Récupérer les infos utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, plan')
      .eq('id', code.user_id)
      .maybeSingle();

    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      user: {
        id:    user?.id,
        email: user?.email,
        name:  user?.name,
        plan:  user?.plan || 'free'
      },
      subscription: {
        expiry:         code.subscription_expiry,
        days_remaining: Math.max(0, daysRemaining),
        is_active:      true
      }
    });
  } catch (err) {
    console.error('[ACTIVATION]', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'activation' });
  }
});

/* ── Vérifier la durée restante (appelé par l'extension) ── */
router.get('/remaining/:activation_id', async (req, res) => {
  try {
    const { activation_id } = req.params;
    const supabase = req.app.locals.supabase;

    const { data: code, error } = await supabase
      .from('activation_codes')
      .select('subscription_expiry')
      .eq('activation_id', activation_id)
      .maybeSingle();

    if (error || !code) {
      return res.status(404).json({ error: 'ID non trouvé' });
    }

    const expiryDate = new Date(code.subscription_expiry);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      expiry:         code.subscription_expiry,
      days_remaining: Math.max(0, daysRemaining),
      is_active:      expiryDate > now
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
