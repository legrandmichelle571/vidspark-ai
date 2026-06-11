-- Verrouillage par appareil (anti-revente) : chaque code d'activation
-- ne fonctionne que sur UN seul appareil à la fois (blocage strict).
-- À exécuter dans Supabase → SQL Editor.

ALTER TABLE public.activation_codes
  ADD COLUMN IF NOT EXISTS device_id       text,
  ADD COLUMN IF NOT EXISTS device_bound_at  timestamptz;

-- Index pour retrouver rapidement un code par appareil
CREATE INDEX IF NOT EXISTS idx_activation_codes_device
  ON public.activation_codes (device_id);
