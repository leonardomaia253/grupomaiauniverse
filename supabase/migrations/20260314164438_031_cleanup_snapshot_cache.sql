DO $$ BEGIN PERFORM cron.unschedule('refresh-city-snapshot'); EXCEPTION WHEN OTHERS THEN NULL; END; $$;
DROP FUNCTION IF EXISTS get_cached_universe_snapshot();
DROP FUNCTION IF EXISTS refresh_universe_snapshot();
DROP FUNCTION IF EXISTS get_universe_snapshot();
DROP TABLE IF EXISTS universe_snapshot_cache;

CREATE INDEX IF NOT EXISTS idx_purchases_gifted_to ON purchases(gifted_to, status) WHERE gifted_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customizations_dev_item ON company_customizations(company_id, item_id);;
