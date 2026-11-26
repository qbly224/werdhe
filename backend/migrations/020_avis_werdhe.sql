-- Migration 020 : avis sur Werdhe (la plateforme).
-- Un utilisateur connecté laisse UN avis (note 1-5 + texte). Il reste « en_attente »
-- tant que l'administrateur ne l'a pas approuvé ; l'admin peut aussi le masquer,
-- l'épingler (affiché en premier) et y répondre publiquement.
-- Idempotente : peut être rejouée sans effet.

CREATE TABLE IF NOT EXISTS avis_werdhe (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note        SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  texte       TEXT NOT NULL CHECK (char_length(texte) BETWEEN 10 AND 1000),
  statut      VARCHAR(12) NOT NULL DEFAULT 'en_attente'
              CHECK (statut IN ('en_attente', 'approuve', 'masque')),
  epingle     BOOLEAN NOT NULL DEFAULT FALSE,
  reponse     TEXT CHECK (reponse IS NULL OR char_length(reponse) <= 1000),
  reponse_at  TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT avis_werdhe_un_par_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_avis_werdhe_affichage
  ON avis_werdhe (statut, epingle DESC, created_at DESC);

-- Accès uniquement via l'API (comme les autres tables) : pas de lecture directe par la clé publique.
ALTER TABLE avis_werdhe ENABLE ROW LEVEL SECURITY;
