-- ══════════════════════════════════════════════════════════════
-- VIDSPARK AI — SCHÉMA SUPABASE COMPLET
-- Exécuter dans l'éditeur SQL de votre projet Supabase
-- ══════════════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLE USERS ────────────────────────────────────────────────
CREATE TABLE public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  avatar          TEXT,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business','diamant')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','suspended')),
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  country         TEXT DEFAULT 'unknown',
  language        TEXT DEFAULT 'fr',
  quota_used      INTEGER DEFAULT 0,
  quota_limit     INTEGER DEFAULT 10,  -- Free=10, Pro=200, Business=1000
  titles_used     INTEGER DEFAULT 0,   -- compteur titres IA (reset quotidien)
  subscription_id TEXT,
  stripe_customer_id TEXT,
  paypal_sub_id   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE SUBSCRIPTIONS ────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('free','pro','business','diamant')),
  provider        TEXT CHECK (provider IN ('stripe','paypal','manual')),
  provider_sub_id TEXT UNIQUE,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','trialing')),
  amount          DECIMAL(10,2),
  currency        TEXT DEFAULT 'eur',
  interval        TEXT CHECK (interval IN ('month','year')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE ANALYSIS HISTORY ─────────────────────────────────────
CREATE TABLE public.analysis_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id        TEXT NOT NULL,
  title           TEXT,
  channel         TEXT,
  thumbnail_url   TEXT,
  views           TEXT,
  score_seo       INTEGER,
  score_viral     INTEGER,
  score_thumbnail INTEGER,
  score_global    INTEGER,
  seo_potential   INTEGER,
  viral_potential INTEGER,
  ctr_estimated   DECIMAL(5,2),
  checklist_data  JSONB,
  ai_report       JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE API KEYS ─────────────────────────────────────────────
CREATE TABLE public.api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash        TEXT NOT NULL UNIQUE,
  name            TEXT,
  last_used       TIMESTAMPTZ,
  requests_count  INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE QUOTA LOGS ───────────────────────────────────────────
CREATE TABLE public.quota_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  video_id        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE PAYMENTS ─────────────────────────────────────────────
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  provider        TEXT,
  provider_payment_id TEXT UNIQUE,
  amount          DECIMAL(10,2),
  currency        TEXT DEFAULT 'eur',
  status          TEXT CHECK (status IN ('succeeded','failed','pending','refunded')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE ADMIN LOGS ───────────────────────────────────────────
CREATE TABLE public.admin_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID REFERENCES public.users(id),
  action          TEXT NOT NULL,
  target_user_id  UUID REFERENCES public.users(id),
  details         JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEX ──────────────────────────────────────────────────────
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_analysis_user ON public.analysis_history(user_id, created_at DESC);
CREATE INDEX idx_analysis_video ON public.analysis_history(video_id);
CREATE INDEX idx_quota_user_date ON public.quota_logs(user_id, created_at DESC);

-- ── TRIGGERS ──────────────────────────────────────────────────

-- Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Créer user après inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Reset quota quotidien (à exécuter via pg_cron ou CRON job)
-- Réinitialise quota_used ET titles_used pour TOUS les plans
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET quota_used  = 0,
      titles_used = 0;
END;
$$ LANGUAGE plpgsql;

-- ── RLS (Row Level Security) ────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users peuvent lire/modifier seulement leur propre ligne
CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (auth_id = auth.uid());

-- Admins voient tout
CREATE POLICY "admin_all_users" ON public.users
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Analysis history: accès à ses propres analyses
CREATE POLICY "own_analysis" ON public.analysis_history
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- ── VUES ADMIN ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  COUNT(*) FILTER (WHERE plan = 'free') as free_users,
  COUNT(*) FILTER (WHERE plan = 'pro') as pro_users,
  COUNT(*) FILTER (WHERE plan = 'business') as business_users,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30d,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_last_7d,
  ROUND(
    COUNT(*) FILTER (WHERE plan != 'free') * 100.0 / NULLIF(COUNT(*),0), 2
  ) as conversion_rate
FROM public.users;

CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) FILTER (WHERE status = 'succeeded') as revenue,
  COUNT(*) FILTER (WHERE status = 'succeeded') as transactions
FROM public.payments
GROUP BY 1 ORDER BY 1 DESC;

-- ══════════════════════════════════════════════════════════════
-- AJOUTS v4.3 — Codes Promo, Licences Manuelles, Invitations Bêta
-- ══════════════════════════════════════════════════════════════

-- ── TABLE PROMO CODES ─────────────────────────────────────────
CREATE TABLE public.promo_codes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL CHECK (type IN ('discount','trial','lifetime','beta')),
  plan          TEXT CHECK (plan IN ('pro','business','diamant')),
  discount_pct  INTEGER DEFAULT 0,
  trial_days    INTEGER DEFAULT 0,
  max_uses      INTEGER DEFAULT 1,
  uses_count    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  expires_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE MANUAL LICENSES ─────────────────────────────────────
CREATE TABLE public.manual_licenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('pro','business','lifetime','diamant')),
  granted_by    UUID REFERENCES public.users(id),
  reason        TEXT,
  expires_at    TIMESTAMPTZ,  -- NULL = lifetime
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE BETA INVITATIONS ────────────────────────────────────
CREATE TABLE public.beta_invitations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','used','expired')),
  plan          TEXT DEFAULT 'pro',
  invited_by    UUID REFERENCES public.users(id),
  used_by       UUID REFERENCES public.users(id),
  used_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE PROMO USES ──────────────────────────────────────────
CREATE TABLE public.promo_uses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_id      UUID NOT NULL REFERENCES public.promo_codes(id),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_id, user_id)
);

-- Ajouter colonne lifetime à users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT false;

-- Index
CREATE INDEX idx_promo_code ON public.promo_codes(code) WHERE is_active = true;
CREATE INDEX idx_beta_token ON public.beta_invitations(token) WHERE status = 'pending';
CREATE INDEX idx_manual_license ON public.manual_licenses(user_id) WHERE is_active = true;
