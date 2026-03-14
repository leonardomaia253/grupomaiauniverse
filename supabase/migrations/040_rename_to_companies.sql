-- ============================================================
-- Git Universe — Rename Developers to Companies
-- ============================================================

-- 1. Rename core tables
alter table if exists developers rename to companies;
alter table if exists city_stats rename to universe_stats;

-- 2. Rename columns in stats
alter table universe_stats rename column total_developers to total_companies;

-- 3. Rename social tables
alter table if exists developer_achievements rename to company_achievements;
alter table if exists developer_kudos rename to company_kudos;
alter table if exists building_visits rename to planet_visits;

-- 4. Rename foreign key columns in other tables
-- activity_feed
alter table activity_feed rename column actor_id to actor_id; -- already actor_id, but good to check
alter table activity_feed rename column target_id to target_id;

-- purchases
alter table purchases rename column developer_id to company_id;
-- gifted_to already exists

-- company_achievements
alter table company_achievements rename column developer_id to company_id;

-- company_kudos
-- giver_id, receiver_id are fine but we should be consistent

-- planet_visits
alter table planet_visits rename column building_id to planet_id;
-- visitor_id is fine

-- 5. Update functions
create or replace function recalculate_ranks()
returns void
language plpgsql
security definer
as $$
begin
  with ranked as (
    select id, row_number() over (order by contributions desc, github_login asc) as new_rank
    from companies
  )
  update companies d
  set rank = r.new_rank
  from ranked r
  where d.id = r.id;

  update universe_stats
  set total_companies    = (select count(*) from companies),
      total_contributions = (select coalesce(sum(contributions), 0) from companies),
      updated_at          = now()
  where id = 1;
end;
$$;

create or replace function increment_kudos_count(target_company_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  update companies
  set kudos_count = kudos_count + 1
  where id = target_company_id;
end;
$$;

create or replace function increment_visit_count(target_company_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  update companies
  set visit_count = visit_count + 1
  where id = target_company_id;
end;
$$;

create or replace function increment_referral_count(referrer_company_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  update companies
  set referral_count = referral_count + 1
  where id = referrer_company_id;
end;
$$;

create or replace function assign_new_company_rank(company_id bigint)
returns void
language plpgsql
security definer
as $$
declare
  total int;
begin
  select count(*) into total from companies;
  update companies set rank = total where id = company_id;
end;
$$;
