-- Table de jetons pour la réinitialisation du mot de passe oublié
-- (déjà appliquée directement sur Supabase production)

CREATE TABLE IF NOT EXISTS reinitialisations_mot_de_passe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(128) NOT NULL UNIQUE,
  expire_at TIMESTAMP NOT NULL,
  utilise BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reinit_mdp_token ON reinitialisations_mot_de_passe(token);
CREATE INDEX IF NOT EXISTS idx_reinit_mdp_user ON reinitialisations_mot_de_passe(user_id);
