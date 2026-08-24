-- 017: Seasonal/limited items system
alter table items add column if not exists available_until timestamptz default null;
alter table items add column if not exists max_quantity int default null;
alter table items add column if not exists is_exclusive boolean default false;
create index if not exists idx_items_available_until on items (available_until) where available_until is not null;;
