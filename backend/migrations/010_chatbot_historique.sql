-- Historique des conversations du chatbot, réservé aux comptes connectés
-- (les visiteurs anonymes gardent une conversation éphémère, non stockée).
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titre      TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user ON chatbot_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  contenu         TEXT NOT NULL,
  image_url       TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON chatbot_messages (conversation_id, created_at);
