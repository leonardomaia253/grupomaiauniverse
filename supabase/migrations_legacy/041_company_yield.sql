-- ============================================================
-- Company Yield and Performance Variation
-- ============================================================

-- 1. Add yield_percent column to companies
alter table if exists companies
  add column if not exists yield_percent numeric default 0;

-- 2. Initialize existing companies with some mock performance data
-- Values between -15 and +25
update companies
set yield_percent = (random() * 40 - 15)
where yield_percent = 0;

-- 3. Comment for documentation
comment on column companies.yield_percent is 'Performance yield of the company. Positive = Healthy, Negative = Unhealthy.';
