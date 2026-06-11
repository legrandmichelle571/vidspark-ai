-- Autoriser PLUSIEURS codes d'activation par utilisateur (Business = 5 codes).
-- L'ancien design imposait 1 code/utilisateur via une contrainte UNIQUE sur user_id.
-- Ce script retire toute contrainte UNIQUE portant uniquement sur user_id.
-- À exécuter dans Supabase → SQL Editor.

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel       ON rel.oid = con.conrelid
    JOIN pg_namespace nsp   ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'activation_codes'
      AND con.contype = 'u'                       -- contrainte UNIQUE
      AND array_length(con.conkey, 1) = 1         -- sur une seule colonne
      AND con.conkey[1] = (
        SELECT attnum FROM pg_attribute
        WHERE attrelid = rel.oid AND attname = 'user_id'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.activation_codes DROP CONSTRAINT %I', c.conname);
    RAISE NOTICE 'Contrainte UNIQUE supprimée : %', c.conname;
  END LOOP;
END $$;

-- Retirer aussi un éventuel index unique sur user_id seul
DROP INDEX IF EXISTS public.activation_codes_user_id_key;

-- Index simple (non unique) pour les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_activation_codes_user_id
  ON public.activation_codes(user_id);
