-- 019_connection_logs.sql
-- Statistiques de connexion (site web + extension) AVEC IP pour le control-panel admin.
--
-- Deux niveaux (voir onglet "Connexions") :
--   1) Dernière connexion par utilisateur → colonnes sur users (affichage rapide)
--        last_active     : déjà ajoutée par 015
--        last_active_src : déjà ajoutée par 018  ('site' | 'ext')
--        last_ip         : ajoutée ici
--   2) Historique détaillé de chaque connexion → table connection_logs
--
-- Écrit côté backend dans des requêtes SÉPARÉES et non bloquantes → résilient :
-- si une colonne/table manque, l'app continue de fonctionner.
--
-- À exécuter dans : Supabase -> SQL Editor. Sans erreur si déjà exécuté.

-- 1) Dernière IP connue (site ou extension)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_ip text;

-- (rappel, sans effet si déjà présentes)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active     timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_src text;

-- 2) Historique détaillé des connexions
CREATE TABLE IF NOT EXISTS public.connection_logs (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
  ip         text,
  source     text,                 -- 'site' | 'ext'
  user_agent text,
  country    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connection_logs_created ON public.connection_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user    ON public.connection_logs (user_id, created_at DESC);

-- Sécurité : accès uniquement via la service_role du backend (bypass RLS).
-- On active RLS SANS policy publique → la clé anon ne peut rien lire (cf. audit RLS).
ALTER TABLE public.connection_logs ENABLE ROW LEVEL SECURITY;
