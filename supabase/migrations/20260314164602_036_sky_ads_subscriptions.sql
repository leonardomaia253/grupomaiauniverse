ALTER TABLE sky_ads
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_sky_ads_subscription_id
  ON sky_ads (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;;
