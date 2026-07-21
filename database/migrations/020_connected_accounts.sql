-- 020_connected_accounts.sql
-- Socle "Providers" (architecture multi-plateformes, Phase 1) — 100% additif.
--
-- N'altère AUCUNE table existante (users, activation_codes, activation_channels…),
-- n'y insère et n'y lit rien. Ces tables ne sont utilisées par aucune route tant que
-- le module Providers n'est pas explicitement activé (variable d'environnement
-- CONNECTIONS_MODULE_ENABLED, introduite en Phase 4) — en Phase 1, aucune route ne
-- les lit ni ne les écrit : elles existent, c'est tout.
--
-- À exécuter dans : Supabase -> SQL Editor. Sans erreur si déjà exécuté.

-- 1) Comptes de plateformes connectés (OAuth) — un Provider par ligne, multi-compte prêt.
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform          text NOT NULL,               -- clé du manifest ('tiktok', 'instagram'…)
  external_id       text NOT NULL,               -- identifiant chez la plateforme (ex: open_id TikTok)
  external_name     text,
  avatar_url        text,
  is_primary        boolean NOT NULL DEFAULT true,
  status            text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','expired','revoked')),
  granted_scopes    text[] DEFAULT '{}',
  access_token_enc  text,                        -- ciphertext AES-256-GCM (base64), jamais en clair
  refresh_token_enc text,
  token_iv          text,                        -- IV du chiffrement (base64)
  token_expires_at  timestamptz,
  last_error        jsonb,                        -- { code, message, at } — voir utils/withProviderCall.js
  metadata          jsonb DEFAULT '{}',
  connected_at      timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(user_id, platform, external_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_connected_accounts_primary
  ON public.connected_accounts (user_id, platform) WHERE is_primary;
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user
  ON public.connected_accounts (user_id);

-- 2) États OAuth temporaires (anti-CSRF + PKCE) — lignes à usage unique.
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state          text PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform       text NOT NULL,
  code_verifier  text,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_created ON public.oauth_states (created_at);

-- 3) Journal d'audit des connexions (observabilité — support/debug sans lire le code).
CREATE TABLE IF NOT EXISTS public.connected_account_events (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connected_account_id uuid REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform             text NOT NULL,
  event_type           text NOT NULL,   -- oauth_start_success/_error | refresh_success/_error |
                                          -- sync_success/_error | revoked | health_check…
  detail               jsonb DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cae_account ON public.connected_account_events (connected_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cae_user    ON public.connected_account_events (user_id, created_at DESC);

-- Sécurité : accès uniquement via la service_role du backend (bypass RLS), comme
-- connection_logs (migration 019). RLS activée SANS policy publique → la clé anon
-- ne peut rien lire ni écrire sur ces 3 tables.
ALTER TABLE public.connected_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_account_events  ENABLE ROW LEVEL SECURITY;
