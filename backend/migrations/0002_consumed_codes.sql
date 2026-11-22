CREATE TABLE IF NOT EXISTS consumed_codes (
  nonce TEXT PRIMARY KEY,
  hub_user_id TEXT NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
