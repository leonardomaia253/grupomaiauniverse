-- 1. Unschedule existing jobs to avoid duplicates (idempotency)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN (
  'cron-ad-expiry', 
  'cron-flush-batches', 
  'cron-streak-reminder', 
  'cron-weekly-digest', 
  'cron-monthly-digest', 
  'cron-re-engagement', 
  'cron-city-snapshot', 
  'cron-cleanup-sessions'
);

-- 2. Schedule the 8 cron jobs
-- Note: Replace 'your-cron-secret' with your actual CRON_SECRET if different.

SELECT cron.schedule(
  'cron-ad-expiry',
  '0 */6 * * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/ad-expiry',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-flush-batches',
  '*/15 * * * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/flush-batches',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-streak-reminder',
  '0 20 * * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/streak-reminder',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-weekly-digest',
  '0 10 * * 1',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/weekly-digest',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-monthly-digest',
  '0 10 1 * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/monthly-digest',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-re-engagement',
  '0 14 * * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/re-engagement',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-city-snapshot',
  '*/5 * * * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/city-snapshot',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);

SELECT cron.schedule(
  'cron-cleanup-sessions',
  '*/5 * * * *',
  $$ SELECT net.http_get(
       url := 'https://thegitcity.com/api/cron/cleanup-sessions',
       headers := '{"Authorization": "Bearer your-cron-secret"}'
     ) $$
);
;
