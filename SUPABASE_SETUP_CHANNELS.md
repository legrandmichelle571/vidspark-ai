# 🔧 SETUP SUPABASE — User Channels Table

## Vue d'ensemble
Cette migration crée la table `user_channels` qui stocke les chaînes YouTube sélectionnées par chaque utilisateur.

**Structure:**
- **FREE/PRO**: Max 1 channel
- **BUSINESS**: Max 5 channels
- **RLS**: Chaque utilisateur ne peut voir que ses propres chaînes
- **Trigger**: Vérification automatique des limites par plan

---

## 📋 Étapes pour appliquer la migration

### Étape 1: Ouvrir Supabase
1. Aller à https://supabase.com
2. Se connecter au projet VidSpark AI
3. Aller à **SQL Editor**

### Étape 2: Copier la migration
Copier le contenu du fichier suivant:
```
E:\extension pro\VidSpark-AI-v1.0\database\migrations\004_user_channels.sql
```

### Étape 3: Exécuter dans Supabase
1. Dans l'éditeur SQL de Supabase, coller le contenu
2. Cliquer sur **RUN** (bouton bleu en haut à droite)
3. Vérifier que pas d'erreurs (console en bas)

### Étape 4: Vérifier
Exécuter cette requête pour confirmer la création:
```sql
SELECT * FROM user_channels LIMIT 1;
```
Résultat attendu: Table vide (ou avec colonnes: id, user_id, youtube_channel_id, etc.)

---

## ✅ Contenu de la migration (004_user_channels.sql)

```sql
-- Table: user_channels
CREATE TABLE IF NOT EXISTS public.user_channels (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  youtube_channel_id TEXT NOT NULL,
  channel_name      TEXT NOT NULL,
  is_primary        BOOLEAN DEFAULT false,
  selected_for_business BOOLEAN DEFAULT false,
  added_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, youtube_channel_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_channels_user_id
  ON public.user_channels(user_id);

-- RLS
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own channels"
  ON public.user_channels FOR SELECT
  USING (user_id = auth.uid());

-- Fonction de vérification des limites
CREATE OR REPLACE FUNCTION check_channel_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_max_channels INTEGER;
  v_channel_count INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM public.users WHERE id = NEW.user_id;
  CASE v_plan
    WHEN 'free' THEN v_max_channels := 1;
    WHEN 'pro' THEN v_max_channels := 1;
    WHEN 'business' THEN v_max_channels := 5;
    ELSE v_max_channels := 1;
  END CASE;
  
  SELECT COUNT(*) INTO v_channel_count
  FROM public.user_channels WHERE user_id = NEW.user_id;
  
  IF v_channel_count >= v_max_channels THEN
    RAISE EXCEPTION 'Channel limit reached for plan %', v_plan;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER tr_check_channel_limit
  BEFORE INSERT ON public.user_channels
  FOR EACH ROW EXECUTE FUNCTION check_channel_limit();
```

---

## 🧪 Test après migration

### Test 1: Vérifier la table
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_channels';
```
Résultat attendu: `user_channels` doit être listé

### Test 2: Vérifier RLS
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_channels';
```
Résultat attendu: Au moins 4 policies listées

### Test 3: Vérifier le trigger
```sql
SELECT proname, prosrc FROM pg_proc 
WHERE proname = 'check_channel_limit';
```
Résultat attendu: Fonction trouvée

---

## ❌ Dépannage

### Erreur: "Table already exists"
- La table existe déjà ✓ C'est normal
- Migration est idempotente (IF NOT EXISTS)

### Erreur: "Users table not found"
- Table `users` doit exister avant
- Exécuter d'abord `database/schema.sql`

### Erreur: "UNIQUE constraint failed"
- Un channel_id est déjà associé à cet utilisateur
- Vérifier les données existantes

---

## 📦 Fichiers associés

**Backend** - Utilise cette table:
- `backend/src/routes/channels.js` — Routes /api/channels/*
- `backend/src/controllers/channelController.js` — Logique

**Frontend** - Affiche le formulaire:
- `VidSpark-Site/channels.html` — Page de sélection
- `VidSpark-Site/js/auth.js` — Authentification

---

## 🎯 Prochaines étapes

1. ✅ Exécuter cette migration
2. 🔄 Déployer backend sur Railway
3. 🔄 Déployer frontend sur Cloudflare Pages
4. 🧪 Tester le flow complet:
   - Login → Select channel → Dashboard → Extension bloque chaînes non autorisées

---

**Date**: 6 Juin 2026  
**Statut**: Prêt à déployer
