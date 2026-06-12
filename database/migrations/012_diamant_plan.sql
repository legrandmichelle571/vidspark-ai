-- ════════════════════════════════════════════════════════════════
-- Migration 012 : autorise le plan « diamant » dans les contraintes
-- ════════════════════════════════════════════════════════════════
-- Sans ça, mettre un utilisateur en « diamant » échoue (la contrainte
-- CHECK rejette la valeur) → le changement ne s'applique pas.
-- À exécuter dans Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- users : free / pro / business / diamant
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE public.users ADD CONSTRAINT users_plan_check
  CHECK (plan IN ('free','pro','business','diamant'));

-- subscriptions (utilisé par les paiements PayPal/Cryptomus)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free','pro','business','diamant'));

-- promo_codes (codes promo ciblant un plan)
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_plan_check;
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_plan_check
  CHECK (plan IN ('pro','business','diamant'));

-- manual_licenses (licences manuelles)
ALTER TABLE public.manual_licenses DROP CONSTRAINT IF EXISTS manual_licenses_plan_check;
ALTER TABLE public.manual_licenses ADD CONSTRAINT manual_licenses_plan_check
  CHECK (plan IN ('pro','business','lifetime','diamant'));
