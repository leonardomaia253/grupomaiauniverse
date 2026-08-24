create table roadmap_votes (
  id bigint generated always as identity primary key,
  company_id bigint not null references companies(id) on delete cascade,
  item_id text not null,
  created_at timestamptz not null default now(),
  unique(company_id, item_id)
);
create index idx_roadmap_votes_item on roadmap_votes(item_id);
alter table roadmap_votes enable row level security;
create policy "Anyone can read votes" on roadmap_votes for select using (true);;
