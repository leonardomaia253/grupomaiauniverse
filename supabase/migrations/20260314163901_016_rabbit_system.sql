-- 016: White Rabbit System
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS rabbit_progress     int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rabbit_started_at   timestamptz NULL,
  ADD COLUMN IF NOT EXISTS rabbit_completed    boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS rabbit_completed_at timestamptz NULL;

INSERT INTO items (id, category, name, description, price_usd_cents, price_brl_cents, is_active)
VALUES ('white_rabbit', 'crown', 'White Rabbit', 'A mysterious white rabbit perched on your rooftop', 0, 0, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO achievements (id, category, name, description, threshold, tier, reward_type, reward_item_id, sort_order)
VALUES ('white_rabbit', 'secret', 'White Rabbit', 'Followed the white rabbit through the city', 1, 'diamond', 'unlock_item', 'white_rabbit', 300)
ON CONFLICT (id) DO NOTHING;;
