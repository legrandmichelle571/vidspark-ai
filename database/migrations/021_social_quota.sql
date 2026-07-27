-- 021_social_quota.sql
-- Quota journalier DÉDIÉ pour les suites "SEO TikTok" et "SEO Instagram" (100% IA,
-- 5 outils chacune) : jusqu'ici elles tapaient dans le quota général daily_analyses
-- (checkQuota), donc pas de limite propre au Free — juste le plafond partagé avec
-- tout le reste. On isole un compteur séparé, avec un plafond Free plus restrictif
-- que le quota général (voir daily_social dans plans.js), pour inciter à l'upgrade
-- sans couper complètement l'accès (contrairement à daily_titles = 0 pour Free).
--
-- À exécuter dans : Supabase -> SQL Editor. Sans erreur si déjà exécuté.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS social_used INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_social_quota(p_user_id UUID)
RETURNS void AS $$
  UPDATE public.users
  SET    social_used = social_used + 1
  WHERE  id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- reset_daily_quotas() (appelée chaque nuit par le cron, voir backend/src/index.js)
-- doit aussi remettre social_used à 0 — on redéfinit la fonction en y ajoutant la
-- 3e colonne, le reste est identique à la version de la migration 003.
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET    quota_used  = 0,
         titles_used = 0,
         social_used = 0;
END;
$$ LANGUAGE plpgsql;
