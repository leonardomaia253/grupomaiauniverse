-- 018: Streak rewards system
create table if not exists streak_rewards (
  id            uuid primary key default gen_random_uuid(),
  company_id  bigint not null references companies(id),
  milestone     int not null,
  item_id       text not null,
  claimed_at    timestamptz default now(),
  unique(company_id, milestone)
);

alter table streak_rewards enable row level security;

create policy "Users can read own streak rewards"
  on streak_rewards for select
  using (company_id in (
    select id from companies where claimed_by = auth.uid()
  ));;
