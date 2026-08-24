-- 020: Add country column to sky_ad_events + expiry_notified
ALTER TABLE sky_ad_events ADD COLUMN IF NOT EXISTS country TEXT;
CREATE INDEX IF NOT EXISTS idx_sky_ad_events_country ON sky_ad_events(country) WHERE country IS NOT NULL;
ALTER TABLE sky_ads ADD COLUMN IF NOT EXISTS expiry_notified TEXT;

DROP MATERIALIZED VIEW IF EXISTS sky_ad_daily_stats;
CREATE MATERIALIZED VIEW sky_ad_daily_stats AS
SELECT
  ad_id,
  date_trunc('day', created_at)::date AS day,
  COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'click') AS clicks,
  COUNT(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks
FROM sky_ad_events
GROUP BY ad_id, date_trunc('day', created_at)::date;

CREATE UNIQUE INDEX idx_sky_ad_daily_stats ON sky_ad_daily_stats(ad_id, day);

SELECT cron.schedule('refresh-ad-stats', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY sky_ad_daily_stats');
SELECT cron.schedule('cleanup-old-ad-events', '0 3 * * *', $$DELETE FROM sky_ad_events WHERE created_at < NOW() - INTERVAL '90 days'$$);;
