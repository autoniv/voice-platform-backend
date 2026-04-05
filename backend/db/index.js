// ============================================================
//  db/index.js  —  PostgreSQL connection via pg-promise
// ============================================================
const pgp = require('pg-promise')();

const db = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }   // Required for Supabase
});

// ─────────────────────────────────────────────────────────────
//  SCHEMA SETUP
//  Run this once to create all tables.
//  Call: node db/setup.js
// ─────────────────────────────────────────────────────────────
const schema = `
  -- Users (your clients)
  CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name   TEXT,
    company     TEXT,
    plan        TEXT NOT NULL DEFAULT 'starter',
    call_limit  INT  NOT NULL DEFAULT 100,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  -- Voice agents created by each client
  CREATE TABLE IF NOT EXISTS agents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    vapi_assistant_id TEXT,
    voice_id          TEXT DEFAULT 'paula',
    language          TEXT DEFAULT 'en',
    system_prompt     TEXT,
    first_message     TEXT,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
  );

  -- Call records (populated by Vapi webhooks)
  CREATE TABLE IF NOT EXISTS calls (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id         UUID REFERENCES agents(id) ON DELETE SET NULL,
    vapi_call_id     TEXT UNIQUE,
    caller_number    TEXT,
    status           TEXT,
    duration_seconds INT  DEFAULT 0,
    cost_usd         NUMERIC(10,4) DEFAULT 0,
    transcript       TEXT,
    summary          TEXT,
    recording_url    TEXT,
    ended_reason     TEXT,
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes for fast lookups
  CREATE INDEX IF NOT EXISTS idx_agents_user   ON agents(user_id);
  CREATE INDEX IF NOT EXISTS idx_calls_user    ON calls(user_id);
  CREATE INDEX IF NOT EXISTS idx_calls_agent   ON calls(agent_id);
  CREATE INDEX IF NOT EXISTS idx_calls_started ON calls(started_at DESC);
`;

module.exports = { db, schema };
