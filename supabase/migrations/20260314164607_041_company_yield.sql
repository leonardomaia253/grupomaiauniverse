-- migration to add yield_percent
ALTER TABLE companies ADD COLUMN IF NOT EXISTS yield_percent float DEFAULT 0.0;;
