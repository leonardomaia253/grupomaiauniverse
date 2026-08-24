-- Revoke every key that may have existed while recoverable credentials were
-- publicly readable. Owners must generate a fresh key through /api/vscode-key.
update public.companies
set vscode_api_key_hash = null
where vscode_api_key_hash is not null;
