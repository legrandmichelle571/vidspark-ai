/**
 * Routes d'authentification
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * POST /api/auth/google
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * GET  /api/auth/verify-email
 */
const router  = require('express').Router();
const Joi     = require('joi');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const supabaseAnon = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ── Validation schemas ── */
const registerSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  name:     Joi.string().min(2).max(50).optional(),
  language: Joi.string().default('fr')
});
const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
});

/* ── Inscription ── */
router.post('/register', async (req, res) => {
  try {
    const { error: valErr, value } = registerSchema.validate(req.body);
    if (valErr) return res.status(400).json({ error: valErr.details[0].message });

    const auth = supabaseAnon();
    const { data, error } = await auth.auth.signUp({
      email: value.email,
      password: value.password,
      options: {
        data: { full_name: value.name || value.email.split('@')[0] },
        emailRedirectTo: process.env.EMAIL_CONFIRM_REDIRECT
      }
    });

    if (error) return res.status(400).json({ error: error.message });

    /* Mettre à jour la langue dans la DB (le trigger crée déjà l'user) */
    if (data.user && value.language) {
      const supabase = req.app.locals.supabase;
      await supabase.from('users')
        .update({ language: value.language })
        .eq('auth_id', data.user.id);
    }

    res.status(201).json({
      message: 'Account created. Check your email to confirm.',
      user: { email: data.user?.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

/* ── Connexion ── */
router.post('/login', async (req, res) => {
  try {
    const { error: valErr, value } = loginSchema.validate(req.body);
    if (valErr) return res.status(400).json({ error: valErr.details[0].message });

    const auth = supabaseAnon();
    const { data, error } = await auth.auth.signInWithPassword({
      email: value.email,
      password: value.password
    });

    if (error) {
  console.log('LOGIN ERROR:', error);
  return res.status(401).json({ error: error.message });
}

    /* Récupérer l'utilisateur complet */
    const supabase = req.app.locals.supabase;
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, name, plan, status, role, quota_used, quota_limit, language')
      .eq('auth_id', data.user.id)
      .single();

    /* Mettre à jour last_login */
    await supabase.from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('auth_id', data.user.id);

    if (dbUser?.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in:    data.session.expires_in,
      user: {
        id:          dbUser.id,
        email:       dbUser.email,
        name:        dbUser.name,
        plan:        dbUser.plan,
        role:        dbUser.role,
        quota_used:  dbUser.quota_used,
        quota_limit: dbUser.quota_limit,
        language:    dbUser.language
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ── Déconnexion ── */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const auth = supabaseAnon();
    await auth.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

/* ── Générer ID + Secret uniques ── */
function generateActivationId() {
  return 'VID' + Math.random().toString(36).substring(2, 11).toUpperCase() + Date.now().toString(36).toUpperCase();
}
function generateActivationSecret() {
  return Math.random().toString(36).substring(2, 18).toUpperCase() + Math.random().toString(36).substring(2, 18).toUpperCase();
}

/* ── Google OAuth via id_token → session Supabase réelle ── */
router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ error: 'id_token requis' });
    }

    /* Authentifier via Supabase avec le vrai JWT Google */
    const auth = supabaseAnon();
    const { data, error } = await auth.auth.signInWithIdToken({
      provider: 'google',
      token:    id_token
    });

    if (error || !data?.session) {
      return res.status(401).json({ error: error?.message || 'Connexion Google échouée' });
    }

    /* Le trigger on_auth_user_created a créé le profil lors du 1er login */
    const supabase = req.app.locals.supabase;

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('activation_id, plan, subscription_expiry')
      .eq('auth_id', data.user.id)
      .single();

    // Générer ou régénérer ID + Secret
    let activationId = existingUser?.activation_id || generateActivationId();
    let activationSecret = generateActivationSecret(); // NOUVEAU secret à chaque login (pour changement de plan)

    // Déterminer la durée du forfait
    let subscriptionExpiry;
    if (existingUser?.plan === 'free') {
      subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours FREE
    } else if (existingUser?.plan === 'pro') {
      subscriptionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an PRO
    } else if (existingUser?.plan === 'business') {
      subscriptionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an BUSINESS
    } else {
      subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut (FREE)
    }

    await supabase.from('users')
      .update({
        last_login: new Date().toISOString(),
        activation_id: activationId,
        activation_secret: activationSecret,
        subscription_expiry: subscriptionExpiry.toISOString()
      })
      .eq('auth_id', data.user.id);

    const { data: dbUser, error: dbErr } = await supabase
      .from('users')
      .select('id, email, name, plan, status, role, quota_used, quota_limit, language, activation_id, activation_secret, subscription_expiry')
      .eq('auth_id', data.user.id)
      .single();

    if (dbErr || !dbUser) {
      return res.status(404).json({ error: 'Profil utilisateur introuvable' });
    }

    if (dbUser.status === 'suspended') {
      return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
    }

    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in:    data.session.expires_in,
      activation_id: dbUser.activation_id,
      activation_secret: dbUser.activation_secret,
      subscription_expiry: dbUser.subscription_expiry,
      user: {
        id:          dbUser.id,
        email:       dbUser.email,
        name:        dbUser.name,
        plan:        dbUser.plan,
        role:        dbUser.role,
        quota_used:  dbUser.quota_used,
        quota_limit: dbUser.quota_limit,
        language:    dbUser.language
      }
    });
  } catch (err) {
    console.error('[GOOGLE AUTH]', err.message);
    res.status(500).json({ error: 'Connexion Google échouée' });
  }
});

/* ── Mot de passe oublié ── */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const auth = supabaseAnon();
    await auth.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.RESET_PASSWORD_REDIRECT
    });

    /* Toujours répondre OK (ne pas révéler si l'email existe) */
    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

/* ── Réinitialisation mot de passe ── */
router.post('/reset-password', async (req, res) => {
  try {
    const { access_token, new_password } = req.body;
    if (!access_token || !new_password) {
      return res.status(400).json({ error: 'Token and new password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const auth = supabaseAnon();
    await auth.auth.setSession({ access_token, refresh_token: '' });
    const { error } = await auth.auth.updateUser({ password: new_password });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

/* ── Rafraîchir token ── */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const auth = supabaseAnon();
    const { data, error } = await auth.auth.refreshSession({ refresh_token });

    if (error) {
  console.log('LOGIN ERROR:', error);
  return res.status(401).json({ error: error.message });
}

    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in:    data.session.expires_in
    });
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed' });
  }
});

/* ── ACTIVATION : Valider ID + Secret (appelé par l'extension) ── */
router.post('/activation/activate', async (req, res) => {
  try {
    const { activation_id, activation_secret } = req.body;

    if (!activation_id || !activation_secret) {
      return res.status(400).json({ error: 'ID et Secret requis' });
    }

    const supabase = req.app.locals.supabase;
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, plan, activation_id, activation_secret, subscription_expiry')
      .eq('activation_id', activation_id)
      .eq('activation_secret', activation_secret)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'ID ou Secret invalide' });
    }

    // Vérifier si l'abonnement n'est pas expiré
    const expiryDate = new Date(user.subscription_expiry);
    const isExpired = expiryDate < new Date();

    if (isExpired) {
      return res.status(403).json({ error: 'Abonnement expiré', expired: true });
    }

    // Calculer les jours restants
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      subscription: {
        expiry: user.subscription_expiry,
        days_remaining: Math.max(0, daysRemaining),
        is_active: !isExpired
      }
    });
  } catch (err) {
    console.error('[ACTIVATION]', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'activation' });
  }
});

/* ── Vérifier la durée restante (appelé par l'extension) ── */
router.get('/activation/remaining/:activation_id', async (req, res) => {
  try {
    const { activation_id } = req.params;

    const supabase = req.app.locals.supabase;
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_expiry')
      .eq('activation_id', activation_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'ID non trouvé' });
    }

    const expiryDate = new Date(user.subscription_expiry);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      expiry: user.subscription_expiry,
      days_remaining: Math.max(0, daysRemaining),
      is_active: expiryDate > now
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
