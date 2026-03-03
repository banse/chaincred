-- Raw indexed events
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT,
  type TEXT NOT NULL,
  protocol TEXT,
  timestamp BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_from ON events (from_address);
CREATE INDEX IF NOT EXISTS idx_events_chain_block ON events (chain_id, block_number);

-- Aggregated wallet activity (mirrors WalletActivity type)
CREATE TABLE IF NOT EXISTS wallet_activity (
  address TEXT PRIMARY KEY,
  first_tx_timestamp BIGINT NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  contracts_deployed INTEGER NOT NULL DEFAULT 0,
  unique_protocols TEXT[] NOT NULL DEFAULT '{}',
  chains_active TEXT[] NOT NULL DEFAULT '{}',
  governance_votes INTEGER NOT NULL DEFAULT 0,
  daos_participated TEXT[] NOT NULL DEFAULT '{}',
  updated_at BIGINT NOT NULL DEFAULT 0
);

-- Block cursor per chain
CREATE TABLE IF NOT EXISTS indexer_cursors (
  chain_id INTEGER PRIMARY KEY,
  last_block BIGINT NOT NULL DEFAULT 0,
  updated_at BIGINT NOT NULL DEFAULT 0
);
