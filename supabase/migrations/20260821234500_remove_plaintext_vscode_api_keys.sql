-- API keys are bearer credentials and must never be recoverable from the database.
-- The application now stores only SHA-256 hashes and displays a newly rotated key once.
alter table public.companies drop column if exists vscode_api_key;
