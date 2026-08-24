-- ============================================================
-- Maia Universe — Generalize Companies (Remove GitHub Dependency)
-- ============================================================

-- 1. Rename core columns in companies
alter table if exists companies rename column github_login to username;
alter table if exists companies rename column github_id to external_id;

-- 2. Add provider column
alter table if exists companies add column if not exists provider text not null default 'github';

-- 3. Update indexes
drop index if exists idx_companies_login;
create index if not exists idx_companies_username on companies (username);

drop index if exists idx_companies_rank_order;
create index if not exists idx_companies_rank_order
  on companies (contributions_total desc, contributions desc, username asc);

-- 4. Update functions

-- recalculate_ranks()
create or replace function recalculate_ranks()
returns void language plpgsql security definer
set statement_timeout = '120s'
as $$
begin
  with ranked as (
    select id, row_number() over (
      order by case when contributions_total > 0 then contributions_total else contributions end desc,
      username asc
    ) as new_rank
    from companies
  )
  update companies d
  set rank = r.new_rank
  from ranked r
  where d.id = r.id
    and d.rank is distinct from r.new_rank;

  update universe_stats
  set total_companies    = (select count(*) from companies),
      total_contributions = (select coalesce(sum(contributions), 0) from companies),
      updated_at          = now()
  where id = 1;
end;
$$;

-- find_auth_user_by_username (renamed from find_auth_user_by_github_login)
drop function if exists find_auth_user_by_github_login(text);
create or replace function find_auth_user_by_username(p_username text)
returns table(id uuid)
language sql
security definer
as $$
  select id
  from auth.users
  where lower(raw_user_meta_data->>'user_name') = lower(p_username)
     or lower(raw_user_meta_data->>'preferred_username') = lower(p_username)
     or lower(email) = lower(p_username)
  limit 1;
$$;

-- get_auth_users_without_record (renamed from get_auth_users_without_company)
drop function if exists get_auth_users_without_company();
create or replace function get_auth_users_without_record()
returns table(username text)
language sql
security definer
as $$
  select lower(coalesce(raw_user_meta_data->>'user_name', raw_user_meta_data->>'preferred_username', email)) as username
  from auth.users
  where (raw_user_meta_data->>'user_name' is not null or raw_user_meta_data->>'preferred_username' is not null or email is not null)
    and not exists (
      select 1 from companies d
      where d.username = lower(coalesce(raw_user_meta_data->>'user_name', raw_user_meta_data->>'preferred_username', email))
    );
$$;

-- 5. Update references in other migrations/logic via backfill
-- (Actually, we just renamed the columns, so most existing queries using the table name 'companies' will work if we update the code too)

-- update ad_events_github_login references
-- (If there was a table named ad_events with github_login column, we should rename it too)
-- Let's check migration 011
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'ad_events' and column_name = 'github_login') then
    alter table ad_events rename column github_login to username;
  end if;
end $$;
