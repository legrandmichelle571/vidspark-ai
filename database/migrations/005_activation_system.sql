-- ══════════════════════════════════════════════════════════════
-- MIGRATION 005: ACTIVATION SYSTEM — Codes d'activation extension
-- ══════════════════════════════════════════════════════════════

-- Ajouter les colonnes d'activation à la table users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS activation_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS activation_secret TEXT,
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ;

-- Index pour recherche rapide par activation_id
CREATE INDEX IF NOT EXISTS idx_users_activation_id
  ON public.users(activation_id);

CREATE INDEX IF NOT EXISTS idx_users_subscription_expiry
  ON public.users(subscription_expiry);
