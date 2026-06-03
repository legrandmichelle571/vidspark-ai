-- ══════════════════════════════════════════════════════════════
-- Migration 001 — Incrément quota atomique
-- Exécuter dans l'éditeur SQL Supabase
-- ══════════════════════════════════════════════════════════════

-- Fonction atomique : incrémente quota_used en une seule opération SQL
-- Évite la race condition "read-then-write" du code applicatif
CREATE OR REPLACE FUNCTION public.increment_user_quota(p_user_id UUID)
RETURNS void AS $$
  UPDATE public.users
  SET    quota_used = quota_used + 1
  WHERE  id = p_user_id
    AND  plan = 'free';
$$ LANGUAGE sql SECURITY DEFINER;
