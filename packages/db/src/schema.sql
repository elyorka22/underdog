CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  applies_to TEXT[] NOT NULL DEFAULT ARRAY['channel', 'group']::TEXT[]
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('channel', 'group', 'bot')),
  category_id TEXT REFERENCES categories(id),
  language TEXT NOT NULL DEFAULT 'uz',
  members_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_id BIGINT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'dead', 'pending')),
  source TEXT NOT NULL DEFAULT 'seed',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing DBs: widen type check and add applies_to without wiping data
ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_type_check;
ALTER TABLE communities
  ADD CONSTRAINT communities_type_check
  CHECK (type IN ('channel', 'group', 'bot'));

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS applies_to TEXT[] NOT NULL DEFAULT ARRAY['channel', 'group']::TEXT[];

CREATE INDEX IF NOT EXISTS idx_categories_applies_to
  ON categories USING GIN (applies_to);

CREATE INDEX IF NOT EXISTS idx_communities_members
  ON communities (members_count DESC);

CREATE INDEX IF NOT EXISTS idx_communities_category
  ON communities (category_id);

CREATE INDEX IF NOT EXISTS idx_communities_type
  ON communities (type);

CREATE INDEX IF NOT EXISTS idx_communities_username_lower
  ON communities (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_communities_language
  ON communities (language);

CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  category_hint TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_candidates_pending
  ON candidates (status, created_at)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS helper_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  processed INTEGER NOT NULL DEFAULT 0,
  succeeded INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS helper_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discovery_queries (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  language TEXT NOT NULL DEFAULT 'uz',
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100,
  auto_run BOOLEAN NOT NULL DEFAULT TRUE,
  times_run INTEGER NOT NULL DEFAULT 0,
  times_empty INTEGER NOT NULL DEFAULT 0,
  candidates_found INTEGER NOT NULL DEFAULT 0,
  communities_found INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discovery_queries_query_lang
  ON discovery_queries (LOWER(query), language);

CREATE INDEX IF NOT EXISTS idx_discovery_queries_enabled_priority
  ON discovery_queries (enabled, auto_run, priority DESC, id ASC);

CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL DEFAULT 'admin',
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
  ON admin_audit (created_at DESC);

CREATE TABLE IF NOT EXISTS helper_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_helper_events_created
  ON helper_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_helper_events_type_created
  ON helper_events (event_type, created_at DESC);

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS query_id BIGINT REFERENCES discovery_queries(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS dismissed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE communities ADD COLUMN IF NOT EXISTS discovery_query_id BIGINT REFERENCES discovery_queries(id);
ALTER TABLE communities ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_candidates_status_created
  ON candidates (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_dismissed
  ON candidates (dismissed);

CREATE INDEX IF NOT EXISTS idx_communities_created
  ON communities (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communities_flagged
  ON communities (flagged)
  WHERE flagged = TRUE;

CREATE INDEX IF NOT EXISTS idx_helper_runs_started
  ON helper_runs (started_at DESC);
