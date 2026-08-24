-- Columns that migration 007 added but were missing
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS kudos_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visit_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_count int NOT NULL DEFAULT 0;

-- Also fix purchases gifted_to that migration 007 added
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS gifted_to bigint REFERENCES companies(id);;
