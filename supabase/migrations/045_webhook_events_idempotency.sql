-- Webhook idempotency ledger.
-- One row per external provider event. Insert-before-processing makes duplicate
-- webhooks cheap and safe.

create table if not exists public.webhook_events (
  id bigserial primary key,
  provider text not null,
  event_id text not null,
  event_type text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.webhook_events enable row level security;

revoke all on table public.webhook_events from anon, authenticated;
grant select, insert on table public.webhook_events to service_role;

create index if not exists idx_webhook_events_provider_created_at
  on public.webhook_events(provider, created_at desc);
