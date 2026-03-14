-- ============================================================
-- Git City — Initial Schema
-- ============================================================

-- 1. companies — one row per GitHub user
create table if not exists companies (
  id            bigint generated always as identity primary key,
  github_login  text    not null unique,
  github_id     bigint,
  name          text,
  avatar_url    text,
  bio           text,
  contributions int     not null default 0,
  public_repos  int     not null default 0,
  total_stars   int     not null default 0,
  primary_language text,
  top_repos     jsonb   not null default '[]'::jsonb,
  rank          int,
  fetched_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_companies_rank on companies (rank);
create index if not exists idx_companies_login on companies (github_login);
create index if not exists idx_companies_contributions on companies (contributions desc);
create index if not exists idx_companies_fetched_at on companies (fetched_at);

-- 2. add_requests — rate limiting table
create table if not exists add_requests (
  id          bigint generated always as identity primary key,
  ip_hash     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_add_requests_ip_created on add_requests (ip_hash, created_at);

-- 3. universe_stats — singleton for global stats
create table if not exists universe_stats (
  id                  int  primary key default 1 check (id = 1),
  total_companies    int  not null default 0,
  total_contributions bigint not null default 0,
  updated_at          timestamptz not null default now()
);

-- seed singleton
insert into universe_stats (id) values (1) on conflict do nothing;

-- 4. RLS — public read for companies and universe_stats
alter table companies   enable row level security;
alter table universe_stats   enable row level security;
alter table add_requests enable row level security;

create policy "Public read companies"
  on companies for select
  using (true);

create policy "Public read universe_stats"
  on universe_stats for select
  using (true);

-- add_requests: no public access (server-side only via service role)

-- 5. recalculate_ranks() — reorders all devs by contributions DESC
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
