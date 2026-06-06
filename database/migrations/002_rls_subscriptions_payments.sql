-- ══════════════════════════════════════════════════════════════
-- Migration 002 — RLS sur subscriptions et payments
-- Exécuter dans l'éditeur SQL Supabase
-- ══════════════════════════════════════════════════════════════

-- ── TABLE SUBSCRIPTIONS ────────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres abonnements
CREATE POLICY "own_subscriptions" ON public.subscriptions
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Les admins voient tous les abonnements
CREATE POLICY "admin_all_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- ── TABLE PAYMENTS ─────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres paiements
CREATE POLICY "own_payments" ON public.payments
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Les admins voient tous les paiements
CREATE POLICY "admin_all_payments" ON public.payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );
