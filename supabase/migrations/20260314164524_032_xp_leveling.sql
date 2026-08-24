-- 032: XP & Leveling System V1
ALTER TABLE companies ADD COLUMN IF NOT EXISTS xp_total integer NOT NULL DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS xp_level integer NOT NULL DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS xp_github integer NOT NULL DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS xp_daily integer NOT NULL DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS xp_daily_date date;

CREATE INDEX IF NOT EXISTS idx_companies_xp_total ON companies(xp_total DESC);

CREATE TABLE IF NOT EXISTS xp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id bigint NOT NULL REFERENCES companies(id),
  source text NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_log_dev ON xp_log(company_id);
CREATE INDEX IF NOT EXISTS idx_xp_log_created ON xp_log(created_at);

CREATE OR REPLACE FUNCTION grant_xp(
  p_company_id bigint,
  p_source text,
  p_amount integer
) RETURNS json LANGUAGE plpgsql AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_daily integer;
  v_actual integer;
  v_new_total integer;
  v_new_level integer;
BEGIN
  UPDATE companies
  SET xp_daily = 0, xp_daily_date = v_today
  WHERE id = p_company_id AND (xp_daily_date IS NULL OR xp_daily_date < v_today);

  SELECT xp_daily INTO v_daily FROM companies WHERE id = p_company_id;

  IF p_source IN ('checkin', 'dailies', 'kudos_given', 'visit', 'fly') THEN
    v_actual := LEAST(p_amount, GREATEST(0, 150 - COALESCE(v_daily, 0)));
  ELSE
    v_actual := p_amount;
  END IF;

  IF v_actual <= 0 THEN RETURN json_build_object('granted', 0, 'reason', 'daily_cap'); END IF;

  UPDATE companies
  SET xp_total = xp_total + v_actual,
      xp_daily = COALESCE(xp_daily, 0) + CASE WHEN p_source IN ('checkin','dailies','kudos_given','visit','fly') THEN v_actual ELSE 0 END,
      xp_daily_date = v_today
  WHERE id = p_company_id
  RETURNING xp_total INTO v_new_total;

  v_new_level := 1;
  WHILE v_new_total >= (25 * POWER(v_new_level + 1, 2.2))::integer LOOP
    v_new_level := v_new_level + 1;
  END LOOP;

  UPDATE companies SET xp_level = GREATEST(xp_level, v_new_level) WHERE id = p_company_id;
  INSERT INTO xp_log (company_id, source, amount) VALUES (p_company_id, p_source, v_actual);

  RETURN json_build_object('granted', v_actual, 'new_total', v_new_total, 'new_level', v_new_level);
END;
$$;;
