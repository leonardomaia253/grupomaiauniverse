-- Expand sky_ads vehicle column to support planet ad formats
ALTER TABLE sky_ads DROP CONSTRAINT IF EXISTS sky_ads_vehicle_check;
ALTER TABLE sky_ads ADD CONSTRAINT sky_ads_vehicle_check
  CHECK (vehicle IN ('plane', 'blimp', 'billboard', 'rooftop_sign', 'led_wrap'));;
