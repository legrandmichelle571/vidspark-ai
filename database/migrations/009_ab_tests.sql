-- A/B Testing des titres (prédiction IA + suivi dans le temps)
-- À exécuter dans Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.ab_tests (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  video_id   text,                         -- vidéo YouTube concernée (optionnel)
  variant_a  text        NOT NULL,         -- titre version A
  variant_b  text        NOT NULL,         -- titre version B
  winner     text,                         -- 'A' | 'B' | null
  ctr_a      numeric,                      -- CTR estimé (ou réel) variante A
  ctr_b      numeric,                      -- CTR estimé (ou réel) variante B
  status     text        DEFAULT 'predicted',  -- 'predicted' | 'running' | 'completed'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_user ON public.ab_tests (user_id, created_at DESC);

ALTER TABLE public.ab_tests DISABLE ROW LEVEL SECURITY;
