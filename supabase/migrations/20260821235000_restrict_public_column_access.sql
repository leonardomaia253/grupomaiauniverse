-- RLS controls rows, not columns. Later migrations added private data to tables
-- that already had public SELECT policies, so restrict anon/authenticated roles
-- to the exact public projection used by the product.

revoke select on table public.companies from anon, authenticated;
grant select (
  id, username, name, avatar_url, bio, contributions, contributions_total,
  public_repos, total_stars, primary_language, top_repos, rank, fetched_at,
  created_at, claimed, category, employee_count, applications_count,
  total_prs, total_reviews, repos_contributed_to, followers, following,
  organizations_count, account_created_at, current_streak,
  active_days_last_year, language_diversity, yield_percent, provider
) on table public.companies to anon, authenticated;

revoke select on table public.sky_ads from anon, authenticated;
grant select (
  id, brand, text, description, color, bg_color, link, vehicle, priority,
  active, starts_at, ends_at, created_at
) on table public.sky_ads to anon, authenticated;
