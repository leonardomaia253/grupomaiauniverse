-- Live Presence: VS Code extension auth + company sessions
-- ============================================================

-- API key column for VS Code extension auth
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vscode_api_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_companies_vscode_api_key
  ON companies(vscode_api_key) WHERE vscode_api_key IS NOT NULL;

-- Company coding sessions table
CREATE TABLE IF NOT EXISTS company_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id        TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'idle', 'offline')),
  current_language  TEXT,
  current_project   TEXT,
  active_seconds    INTEGER DEFAULT 0,
  total_heartbeats  INTEGER DEFAULT 0,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  editor_name       TEXT DEFAULT 'vscode',
  os                TEXT,
  UNIQUE(company_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_company_sessions_status
  ON company_sessions(status) WHERE status != 'offline';

CREATE INDEX IF NOT EXISTS idx_company_sessions_last_heartbeat
  ON company_sessions(last_heartbeat_at) WHERE status != 'offline';

-- RLS
ALTER TABLE company_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sessions" ON company_sessions
  FOR SELECT USING (true);

CREATE POLICY "Service role manages sessions" ON company_sessions
  FOR ALL USING (true) WITH CHECK (true);
