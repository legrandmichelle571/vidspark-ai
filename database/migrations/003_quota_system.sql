-- ══════════════════════════════════════════════════════════════
-- Migration 003 — Système de quotas complet
-- Exécuter dans l'éditeur SQL Supabase
-- ══════════════════════════════════════════════════════════════

-- 1. Ajouter colonne titles_used (titres IA générés aujourd'hui)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS titles_used INTEGER NOT NULL DEFAULT 0;

-- 2. Corriger le DEFAULT de quota_limit : 5 → 10 (plan Free)
ALTER TABLE public.users
  ALTER COLUMN quota_limit SET DEFAULT 10;

-- 3. Aligner quota_limit des utilisateurs existants
UPDATE public.users SET quota_limit = 10   WHERE plan = 'free';
UPDATE public.users SET quota_limit = 200  WHERE plan = 'pro';
UPDATE public.users SET quota_limit = 1000 WHERE plan = 'business';

-- 4. increment_user_quota : s'applique désormais à TOUS les plans
--    (suppression de la condition AND plan = 'free')
CREATE OR REPLACE FUNCTION public.increment_user_quota(p_user_id UUID)
RETURNS void AS $$
  UPDATE public.users
  SET    quota_used = quota_used + 1
  WHERE  id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Nouvelle fonction : incrémenter le compteur de titres IA
CREATE OR REPLACE FUNCTION public.increment_titles_quota(p_user_id UUID)
RETURNS void AS $$
  UPDATE public.users
  SET    titles_used = titles_used + 1
  WHERE  id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. reset_daily_quotas : réinitialise quota_used ET titles_used
--    pour TOUS les plans (était limité à plan = 'free')
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET    quota_used  = 0,
         titles_used = 0;
END;
$$ LANGUAGE plpgsql;
