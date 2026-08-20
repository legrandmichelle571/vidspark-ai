-- ══════════════════════════════════════════════════════════════
-- MIGRATION 023: EXTENSION PAIRING — Handshake sécurisé + code de secours
-- ══════════════════════════════════════════════════════════════
-- Remplace la saisie manuelle "ID d'activation + Code secret" par :
--   A) un handshake automatique (nonce/state, usage unique, courte durée de vie)
--   B) un code de secours à un seul champ si la détection/handshake échoue
--
-- Couche fine par-dessus le système d'activation existant (routes/activation.js,
-- table activation_codes, activation_devices, activation_channels) — AUCUN de
-- ces objets n'est créé, modifié ou touché par cette migration. Le pairing ne
-- fait que résoudre un user_id et restituer son credential activation_codes
-- existant (find-or-create côté application, backend/src/routes/extensionPairing.js) ;
-- le device-lock/channel-lock restent entièrement gérés par /api/activation/activate.
--
-- IDEMPOTENTE : pairing_requests et pairing_manual_codes existent déjà en
-- production (créées par une exécution antérieure de ce même contenu, sous un
-- numéro de migration qui entrait en conflit avec la numérotation réelle du
-- projet — voir historique). Ce fichier, réexécuté, ne fait rien de plus
-- (CREATE TABLE/INDEX IF NOT EXISTS uniquement).

-- ── pairing_requests : handshake automatique site → extension ──────────
CREATE TABLE IF NOT EXISTS public.pairing_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nonce_hash    TEXT NOT NULL,          -- sha256(nonce) — le nonce brut ne transite jamais par le site
  state         TEXT UNIQUE NOT NULL,   -- valeur aléatoire renvoyée au site puis relayée à l'extension
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_requests_state
  ON public.pairing_requests(state);

CREATE INDEX IF NOT EXISTS idx_pairing_requests_user_id
  ON public.pairing_requests(user_id);

-- Purge facile des lignes expirées (appelable depuis un cron applicatif si besoin)
CREATE INDEX IF NOT EXISTS idx_pairing_requests_expires_at
  ON public.pairing_requests(expires_at)
  WHERE status = 'pending';

ALTER TABLE public.pairing_requests ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accès exclusivement via la clé service_role côté backend.

-- ── pairing_manual_codes : code de secours à un seul champ ─────────────
CREATE TABLE IF NOT EXISTS public.pairing_manual_codes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code_hash     TEXT UNIQUE NOT NULL,   -- sha256(code) — le code en clair n'est jamais stocké
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'expired')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_manual_codes_code_hash
  ON public.pairing_manual_codes(code_hash);

CREATE INDEX IF NOT EXISTS idx_pairing_manual_codes_user_id
  ON public.pairing_manual_codes(user_id);

ALTER TABLE public.pairing_manual_codes ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accès exclusivement via la clé service_role côté backend.

-- NOTE — activation_codes : cette migration ne la crée pas, ne la modifie pas.
-- Son RLS a été activé par l'exécution précédente (portant le même contenu
-- sous l'ancien numéro 006) ; c'est laissé tel quel intentionnellement — le
-- backend n'y accède que via service_role, qui bypass RLS, donc aucune
-- fonctionnalité n'est affectée. Ne pas désactiver RLS ici : ce ne serait pas
-- nécessaire et reviendrait sur une décision déjà prise et vérifiée sûre.
