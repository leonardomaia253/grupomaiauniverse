-- Add city_theme column to companies table
-- Stores the user's preferred theme index (0=Midnight, 1=Sunset, 2=Neon, 3=Emerald)
alter table companies add column if not exists city_theme smallint not null default 0;
