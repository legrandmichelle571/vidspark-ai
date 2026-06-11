-- Multi-appareils par code : 1 code peut être actif sur N PC selon le plan
-- (Free/Pro = 1 PC, Business = 5 PC). Chaque (code, appareil) = une ligne.
-- À exécuter dans Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.activation_devices (
  activation_id text        NOT NULL,
  device_id     text        NOT NULL,
  user_id       uuid,
  bound_at      timestamptz DEFAULT now(),
  PRIMARY KEY (activation_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_activation_devices_code ON public.activation_devices (activation_id);
CREATE INDEX IF NOT EXISTS idx_activation_devices_user ON public.activation_devices (user_id);

ALTER TABLE public.activation_devices DISABLE ROW LEVEL SECURITY;
