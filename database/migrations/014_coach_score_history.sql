-- 014 — Historique du Score de chaîne (Coach IA)
-- Permet la progression « +X cette semaine » et la courbe 30 jours.
-- À exécuter dans Supabase (SQL Editor). Sans cette table, le Coach
-- continue de fonctionner (il utilise le "trend" récent vs précédent).

CREATE TABLE IF NOT EXISTS coach_score_history (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      INT  NOT NULL,
  potential  INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_score_history_user_date
  ON coach_score_history (user_id, created_at);
