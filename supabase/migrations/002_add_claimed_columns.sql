-- ============================================================
-- Git City — Add claimed columns for Autenticação Maia
-- ============================================================

alter table companies
  add column if not exists claimed      boolean      not null default false,
  add column if not exists claimed_by   uuid         references auth.users(id),
  add column if not exists fetch_priority int        not null default 0,
  add column if not exists claimed_at   timestamptz;

create index if not exists idx_companies_claimed
  on companies (claimed) where claimed = true;
