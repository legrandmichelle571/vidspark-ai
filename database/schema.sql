/**
 * VidSpark AI - Complete PostgreSQL Schema
 * Exécuter sur Supabase directement dans l'éditeur SQL
 */

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "crypto";

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  password_hash TEXT,
  avatar_url TEXT,
  phone TEXT,
  company TEXT,
  website TEXT,
  bio TEXT,

  -- Plan & Subscription
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business', 'enterprise')),
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Quotas
  monthly_usage INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 10,
  monthly_reports_usage INTEGER DEFAULT 0,
  monthly_reports_limit INTEGER DEFAULT 0,
  monthly_titles_usage INTEGER DEFAULT 0,
  monthly_titles_limit INTEGER DEFAULT 0,

  -- Profile
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_google_id ON public.users(google_id);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_users_status ON public.users(status);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete')),

  -- Stripe Integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  stripe_product_id TEXT,

  -- Billing Period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment
  amount_paid INTEGER, -- in cents
  next_billing_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_active_subscription
    UNIQUE (user_id, status) WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- ============================================
-- CREDITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  amount INTEGER NOT NULL, -- Analysis credits
  used INTEGER DEFAULT 0,
  remaining INTEGER DEFAULT 0,

  source TEXT NOT NULL CHECK (source IN ('purchase', 'referral', 'promotion', 'refund')),
  reason TEXT,

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 months'),
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credits_user_id ON public.credits(user_id);
CREATE INDEX idx_credits_active ON public.credits(is_active);
CREATE INDEX idx_credits_expires ON public.credits(expires_at);

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('youtube_channel', 'website', 'other')),

  youtube_channel_id TEXT,
  youtube_channel_name TEXT,
  youtube_channel_avatar TEXT,
  youtube_subscriber_count INTEGER,

  owner_email TEXT,
  shared_with UUID[],

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_youtube_id ON public.projects(youtube_channel_id);
CREATE INDEX idx_projects_active ON public.projects(is_active);

-- ============================================
-- VIDEOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  youtube_video_id TEXT UNIQUE,
  youtube_url TEXT,

  description TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,

  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_videos_project_id ON public.videos(project_id);
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_youtube_id ON public.videos(youtube_video_id);

-- ============================================
-- ANALYSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('seo', 'engagement', 'audience', 'competitor', 'full')),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini', 'deepseek')),

  -- Input
  youtube_video_id TEXT,
  video_url TEXT,

  -- Results
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  results JSONB, -- Stores analysis results as JSON

  -- Scores
  seo_score NUMERIC(3,1),
  engagement_score NUMERIC(3,1),
  audience_score NUMERIC(3,1),
  competitor_score NUMERIC(3,1),
  overall_score NUMERIC(3,1),

  -- AI Generated
  title_suggestions TEXT[],
  description_suggestions TEXT,
  hashtags TEXT[],

  -- Credits
  credits_used INTEGER DEFAULT 10,

  -- Timestamps
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_project_id ON public.analyses(project_id);
CREATE INDEX idx_analyses_video_id ON public.analyses(video_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_provider ON public.analyses(provider);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

-- ============================================
-- PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Stripe Info
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,

  -- Details
  amount INTEGER NOT NULL, -- in cents (e.g., 999 = $9.99)
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  description TEXT,
  plan TEXT,

  -- Refund
  refunded BOOLEAN DEFAULT FALSE,
  refund_amount INTEGER,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,

  old_values JSONB,
  new_values JSONB,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users: Can only see own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Subscriptions: Can only see own
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Credits: Can only see own
CREATE POLICY "Users can view own credits"
  ON public.credits FOR SELECT
  USING (auth.uid() = user_id);

-- Projects: Can see own and shared
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Videos: Can see own and in own projects
CREATE POLICY "Users can view own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- Analyses: Can see own
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Payments: Can see own
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update users.updated_at on any change
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Update subscriptions.updated_at
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION (
    CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  );

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to reset monthly quotas (called by CRON)
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET monthly_usage = 0,
      monthly_reports_usage = 0,
      monthly_titles_usage = 0
  WHERE status = 'active';

  RAISE NOTICE 'Monthly quotas reset for all active users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment monthly usage
CREATE OR REPLACE FUNCTION increment_monthly_usage(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET monthly_usage = monthly_usage + p_amount
  WHERE id = p_user_id
  AND status = 'active'
  AND monthly_usage < monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check quota
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID)
RETURNS TABLE (
  remaining INTEGER,
  limit INTEGER,
  exceeded BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (monthly_limit - monthly_usage)::INTEGER,
    monthly_limit,
    (monthly_usage >= monthly_limit)::BOOLEAN
  FROM public.users
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.plan,
    u.subscription_status,
    u.plan_expires_at,
    s.current_period_end,
    s.next_billing_date
  FROM public.users u
  LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active'
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA
-- ============================================

-- No initial data needed - users create accounts via auth

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.users IS 'VidSpark users with subscription and quota tracking';
COMMENT ON TABLE public.subscriptions IS 'Stripe subscription tracking';
COMMENT ON TABLE public.projects IS 'YouTube channels or projects being analyzed';
COMMENT ON TABLE public.videos IS 'Videos within projects';
COMMENT ON TABLE public.analyses IS 'Video analyses results';
COMMENT ON TABLE public.payments IS 'Payment history';
COMMENT ON COLUMN public.analyses.results IS 'JSON object with analysis results: {seo: {...}, engagement: {...}, etc}';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID for webhook handling';
