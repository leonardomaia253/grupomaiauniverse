-- Background function that refreshes the cache.
-- Called by pg_cron every 5 minutes.
CREATE OR REPLACE FUNCTION refresh_universe_snapshot()
RETURNS void
LANGUAGE plpgsql
SET statement_timeout = '180s'
AS $$
DECLARE
  snapshot jsonb;
BEGIN
  SELECT get_universe_snapshot()::jsonb INTO snapshot;

  INSERT INTO universe_snapshot_cache (id, data, refreshed_at)
  VALUES (1, snapshot, now())
  ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data,
        refreshed_at = EXCLUDED.refreshed_at;
END;
$$;
;
