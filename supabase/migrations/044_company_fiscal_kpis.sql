-- 044: Company Fiscal KPIs
-- Add fiscal metrics for 3D visualization

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS share_capital NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;

-- Backfill random data for immediate visualization test
UPDATE companies
SET
  share_capital = (RANDOM() * 1000000)::NUMERIC,
  revenue = (RANDOM() * 500000)::NUMERIC,
  health_score = (RANDOM() * 100)::INTEGER
WHERE share_capital = 0 AND revenue = 0;

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
        SELECT id, username, name, avatar_url, contributions, total_stars,
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
               -- B2B METRICS --
               category,
               employee_count,
               applications_count,
               yield_percent,
               -- NEW FISCAL KPIs --
               COALESCE(share_capital, 0) AS share_capital,
               COALESCE(revenue, 0) AS revenue,
               COALESCE(health_score, 100) AS health_score
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
