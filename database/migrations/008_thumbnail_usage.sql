-- Quota mensuel de génération de miniatures (Pro=30/mois, Business=50/mois)
-- À exécuter dans Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.thumbnail_usage (
  user_id uuid  NOT NULL,
  month   text  NOT NULL,           -- 'YYYY-MM'
  count   int   DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

ALTER TABLE public.thumbnail_usage DISABLE ROW LEVEL SECURITY;
