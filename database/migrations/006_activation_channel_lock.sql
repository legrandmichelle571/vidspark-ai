-- Verrou « 1 ID = 1 chaîne » : lier une chaîne YouTube à un code d'activation
-- À exécuter dans Supabase → SQL Editor

ALTER TABLE public.activation_codes
  ADD COLUMN IF NOT EXISTS channel_id   TEXT,
  ADD COLUMN IF NOT EXISTS channel_name TEXT;

-- Index pour retrouver rapidement par chaîne
CREATE INDEX IF NOT EXISTS idx_activation_codes_channel_id
  ON public.activation_codes(channel_id);
