-- 042: B2B Metrics & 3D Analytics

-- Add new business-focused columns for 3D visualization
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Technology',
  ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Backfill some data randomly to existing companies for immediate 3D testing
DO $$ 
DECLARE 
  r RECORD;
  v_category TEXT;
  v_employees INTEGER;
  v_apps INTEGER;
  categories TEXT[] := ARRAY['Fintech', 'Healthtech', 'Edtech', 'Agrotech', 'Retail', 'SaaS', 'Cybersecurity', 'Logistics', 'Energy'];
BEGIN
  FOR r IN SELECT id, contributions, total_stars FROM companies LOOP
    -- Assign a random category based on ID modulo to be deterministic
    v_category := categories[(r.id % array_length(categories, 1)) + 1];
    
    -- Estimate employee count based on contributions/stars heuristically for visual impact
    v_employees := LEAST(GREATEST(r.contributions / 10 + r.total_stars / 5, 5), 5000);
    
    -- Estimate applications based on stars
    v_apps := LEAST(GREATEST((r.total_stars % 10) + 1, 1), 15);

    UPDATE companies 
    SET 
      category = v_category,
      employee_count = v_employees,
      applications_count = v_apps
    WHERE id = r.id AND (category = 'Technology' OR category IS NULL);
  END LOOP;
END $$;

-- Update the universe snapshot RPC to include the new business metrics
CREATE OR REPLACE FUNCTION get_universe_snapshot()
RETURNS json
LANGUAGE sql
STABLE
SET statement_timeout = '60s'
AS $$
  SELECT json_build_object(
    'companies', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT id, github_login, name, avatar_url, contributions, total_stars,
               public_repos, primary_language, rank, claimed,
               COALESCE(kudos_count, 0) AS kudos_count,
               COALESCE(visit_count, 0) AS visit_count,
               contributions_total, contribution_years, total_prs, total_reviews,
               repos_contributed_to, followers, following, organizations_count,
               account_created_at, current_streak, active_days_last_year,
               language_diversity,
               COALESCE(app_streak, 0) AS app_streak,
               COALESCE(rabbit_completed, false) AS rabbit_completed,
               district, district_chosen,
               COALESCE(raid_xp, 0) AS raid_xp,
               COALESCE(current_week_contributions, 0) AS current_week_contributions,
               COALESCE(current_week_kudos_given, 0) AS current_week_kudos_given,
               COALESCE(current_week_kudos_received, 0) AS current_week_kudos_received,
               -- NEW B2B METRICS --
               category,
               employee_count,
               applications_count,
               yield_percent
        FROM companies
        ORDER BY rank ASC
      ) t
    ),
    'purchases', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (SELECT company_id, item_id FROM purchases WHERE status = 'completed' AND gifted_to IS NULL) t
    ),
    'gift_purchases', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (SELECT gifted_to, item_id FROM purchases WHERE status = 'completed' AND gifted_to IS NOT NULL) t
    ),
    'customizations', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (SELECT company_id, item_id, config FROM company_customizations WHERE item_id IN ('custom_color', 'billboard', 'loadout')) t
    ),
    'achievements', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (SELECT company_id, achievement_id FROM company_achievements) t
    ),
    'raid_tags', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (SELECT planet_id, attacker_login, tag_style, expires_at FROM raid_tags WHERE active = true) t
    ),
    'stats', (
      SELECT row_to_json(t) FROM (SELECT * FROM universe_stats WHERE id = 1) t
    )
  );
$$;
