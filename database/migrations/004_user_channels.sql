-- ══════════════════════════════════════════════════════════════
-- MIGRATION 004: USER CHANNELS — Gestion des chaînes YouTube
-- ══════════════════════════════════════════════════════════════

-- Table: user_channels
-- Stocke les chaînes YouTube sélectionnées par l'utilisateur
-- - GRATUIT/PRO: 1 seule chaîne
-- - BUSINESS: jusqu'à 5 chaînes

CREATE TABLE IF NOT EXISTS public.user_channels (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  youtube_channel_id TEXT NOT NULL,  -- ID unique YouTube (UCxxxxx)
  channel_name      TEXT NOT NULL,   -- Nom de la chaîne
  is_primary        BOOLEAN DEFAULT false,  -- Chaîne principale (pour GRATUIT/PRO)
  selected_for_business BOOLEAN DEFAULT false,  -- Sélectionnée au passage en BUSINESS
  added_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: unique user + channel
  UNIQUE(user_id, youtube_channel_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_user_channels_user_id
  ON public.user_channels(user_id);

CREATE INDEX IF NOT EXISTS idx_user_channels_primary
  ON public.user_channels(user_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_user_channels_business
  ON public.user_channels(user_id)
  WHERE selected_for_business = true;

-- RLS: L'utilisateur ne peut voir que ses propres chaînes
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own channels"
  ON public.user_channels
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own channels"
  ON public.user_channels
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own channels"
  ON public.user_channels
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own channels"
  ON public.user_channels
  FOR DELETE
  USING (user_id = auth.uid());

-- Fonction: Vérifier la limite de chaînes selon le plan
CREATE OR REPLACE FUNCTION check_channel_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_max_channels INTEGER;
  v_channel_count INTEGER;
BEGIN
  -- Récupérer le plan de l'utilisateur
  SELECT plan INTO v_plan FROM public.users WHERE id = NEW.user_id;

  -- Définir la limite selon le plan
  CASE v_plan
    WHEN 'free' THEN v_max_channels := 1;
    WHEN 'pro' THEN v_max_channels := 1;
    WHEN 'business' THEN v_max_channels := 5;
    ELSE v_max_channels := 1;
  END CASE;

  -- Compter les chaînes actuelles
  SELECT COUNT(*) INTO v_channel_count
  FROM public.user_channels
  WHERE user_id = NEW.user_id;

  -- Vérifier la limite
  IF v_channel_count >= v_max_channels THEN
    RAISE EXCEPTION 'Channel limit reached for plan %', v_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Vérifier avant insertion
CREATE TRIGGER tr_check_channel_limit
  BEFORE INSERT ON public.user_channels
  FOR EACH ROW
  EXECUTE FUNCTION check_channel_limit();
