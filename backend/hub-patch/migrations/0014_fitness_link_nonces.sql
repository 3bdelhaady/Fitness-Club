-- Renumber to the next free migration slot at merge time.
CREATE TABLE IF NOT EXISTS fitness_link_nonces (
  nonce TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS fitness_link_nonces_user ON fitness_link_nonces (user_id);
