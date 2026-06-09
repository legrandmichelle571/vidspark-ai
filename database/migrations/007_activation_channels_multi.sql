-- Multi-chaînes : 1 abonné (code) peut autoriser plusieurs chaînes selon son plan
-- Gratuit/Pro = 1 chaîne, Business = 5 chaînes.
-- À exécuter dans Supabase → SQL Editor.

CREATE TABLE IF NOT EXISTS public.activation_channels (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL,
  channel_id   text NOT NULL,
  channel_name text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

ALTER TABLE public.activation_channels DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activation_channels_user
  ON public.activation_channels(user_id);
