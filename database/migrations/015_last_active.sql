-- Suivi "en ligne" temps réel : dernière activité de l'utilisateur (site OU extension).
-- Bumpé à chaque action (getCodeUser côté extension, /plan & /me côté site).
-- À exécuter dans Supabase → SQL Editor. Sans erreur si déjà exécuté.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_active timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_last_active
  ON public.users (last_active DESC);
