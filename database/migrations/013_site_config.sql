-- ════════════════════════════════════════════════════════════════
-- Migration 013 : table clé/valeur pour la config du site (pubs, etc.)
-- À exécuter dans Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.site_config (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lignes par défaut pour les emplacements pub (vides au départ)
INSERT INTO public.site_config (key, value) VALUES
  ('ad_home', ''),
  ('ad_dashboard', '')
ON CONFLICT (key) DO NOTHING;
