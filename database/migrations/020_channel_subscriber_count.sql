-- 020_channel_subscriber_count.sql
-- Nombre d'abonnés YouTube par chaîne connectée (dashboard : tuile "Abonnés YouTube").
-- Alimenté par backend/src/routes/user.js (fetchChannelSubscribers) : au moment de
-- l'ajout de la chaîne, puis en rattrapage pour les chaînes déjà existantes qui
-- n'avaient pas encore cette colonne.
--
-- À exécuter dans : Supabase -> SQL Editor. Sans erreur si déjà exécuté.

ALTER TABLE public.activation_channels
  ADD COLUMN IF NOT EXISTS subscriber_count bigint;
