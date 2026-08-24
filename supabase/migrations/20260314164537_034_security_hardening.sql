ALTER TABLE companies ADD COLUMN IF NOT EXISTS vscode_api_key_hash TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_companies_vscode_api_key_hash ON companies(vscode_api_key_hash) WHERE vscode_api_key_hash IS NOT NULL;

UPDATE companies SET vscode_api_key_hash = encode(sha256(vscode_api_key::bytea), 'hex') WHERE vscode_api_key IS NOT NULL AND vscode_api_key_hash IS NULL;

DROP INDEX IF EXISTS idx_companies_vscode_api_key;
ALTER TABLE companies DROP COLUMN IF EXISTS vscode_api_key;

DROP POLICY IF EXISTS "Public read sessions" ON company_sessions;
CREATE POLICY "No direct public read" ON company_sessions FOR SELECT USING (false);;
