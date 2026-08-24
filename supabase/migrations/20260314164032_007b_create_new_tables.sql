-- Create the new-named tables that migration 007 would have created
-- (the DB has developer_* named versions from old migrations)

-- company_achievements
CREATE TABLE IF NOT EXISTS company_achievements (
  company_id    bigint not null references companies(id),
  achievement_id  text not null references achievements(id),
  unlocked_at     timestamptz not null default now(),
  seen            boolean not null default false,
  primary key (company_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_dev_achievements_dev ON company_achievements(company_id);
ALTER TABLE company_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read company_achievements" ON company_achievements;
CREATE POLICY "Public read company_achievements" ON company_achievements FOR SELECT USING (true);

-- company_kudos
CREATE TABLE IF NOT EXISTS company_kudos (
  giver_id      bigint not null references companies(id),
  receiver_id   bigint not null references companies(id),
  given_date    date not null default current_date,
  created_at    timestamptz not null default now(),
  primary key (giver_id, receiver_id, given_date)
);

CREATE INDEX IF NOT EXISTS idx_kudos_giver_date ON company_kudos(giver_id, given_date);
CREATE INDEX IF NOT EXISTS idx_kudos_receiver ON company_kudos(receiver_id);
ALTER TABLE company_kudos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read kudos" ON company_kudos;
CREATE POLICY "Public read kudos" ON company_kudos FOR SELECT USING (true);

-- planet_visits
CREATE TABLE IF NOT EXISTS planet_visits (
  visitor_id    bigint not null references companies(id),
  planet_id   bigint not null references companies(id),
  visit_date    date not null default current_date,
  created_at    timestamptz not null default now(),
  primary key (visitor_id, planet_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_visits_planet ON planet_visits(planet_id);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_date ON planet_visits(visitor_id, visit_date);
ALTER TABLE planet_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read visits" ON planet_visits;
CREATE POLICY "Public read visits" ON planet_visits FOR SELECT USING (true);;
