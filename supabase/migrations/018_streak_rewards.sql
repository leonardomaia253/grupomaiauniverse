-- A12: Streak rewards system
-- Tracks which streak milestone rewards have been claimed per company

create table if not exists streak_rewards (
  id            uuid primary key default gen_random_uuid(),
  company_id  bigint not null references companies(id),
  milestone     int not null,          -- streak day milestone (3, 7, 14, 30)
  item_id       text not null,         -- item granted
  claimed_at    timestamptz default now(),
  unique(company_id, milestone)      -- each milestone claimed once
);

-- RLS: devs can read their own rewards
alter table streak_rewards enable row level security;

create policy "Users can read own streak rewards"
  on streak_rewards for select
  using (company_id in (
    select id from companies where claimed_by = auth.uid()
  ));
