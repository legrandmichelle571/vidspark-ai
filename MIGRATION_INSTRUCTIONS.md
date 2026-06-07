# 🔧 Instructions pour appliquer la migration d'activation

## ❌ Problème détecté
Les colonnes `activation_id`, `activation_secret`, et `subscription_expiry` n'existent pas encore dans la table `users` de Supabase.

## ✅ Solution

### Étape 1 : Accéder à Supabase
1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Ouvrez le projet **VidSpark AI**
4. Allez sur l'onglet **SQL Editor** (ou **SQL**)

### Étape 2 : Exécuter la migration

Copiez et collez ce code SQL dans l'éditeur :

```sql
-- Ajouter les colonnes d'activation à la table users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS activation_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS activation_secret TEXT,
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ;

-- Index pour recherche rapide par activation_id
CREATE INDEX IF NOT EXISTS idx_users_activation_id
  ON public.users(activation_id);

CREATE INDEX IF NOT EXISTS idx_users_subscription_expiry
  ON public.users(subscription_expiry);
```

Puis cliquez sur le bouton **Run** (▶️) ou appuyez sur `Ctrl+Enter`.

### Étape 3 : Vérifier que c'est bon

Exécutez cette requête pour vérifier que les colonnes ont été créées :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('activation_id', 'activation_secret', 'subscription_expiry');
```

Vous devriez voir **3 lignes** retournées.

### Étape 4 : Tester le système complet

Une fois la migration faite :

1. **Vide le cache du dashboard** (Ctrl+Shift+R ou F12 > Application > Clear site data)
2. **Reconnecte-toi au dashboard** (https://vidspark-site.pages.dev)
3. **Puis connecte-toi avec Google**
4. **Vérifiez que les champs ID et Secret s'affichent**

---

**Questions ?** Exécute `node run-migrations.js` dans le dossier backend une fois la migration faite.
