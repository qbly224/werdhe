-- Comptes d'équipe pour le plan Agence (jusqu'à 5 membres partageant
-- les biens, réservations, paiements et l'abonnement du compte agence).
CREATE TABLE IF NOT EXISTS membres_equipe (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agence_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  email            VARCHAR NOT NULL,
  statut           VARCHAR NOT NULL DEFAULT 'invite' CHECK (statut IN ('invite', 'actif', 'revoque')),
  token_invitation VARCHAR,
  created_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE (agence_id, email)
);

CREATE INDEX IF NOT EXISTS idx_membres_equipe_user_id   ON membres_equipe(user_id);
CREATE INDEX IF NOT EXISTS idx_membres_equipe_agence_id ON membres_equipe(agence_id);
CREATE INDEX IF NOT EXISTS idx_membres_equipe_token      ON membres_equipe(token_invitation);
