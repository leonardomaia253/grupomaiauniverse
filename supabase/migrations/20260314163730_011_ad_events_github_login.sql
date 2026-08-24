-- Add github_login to sky_ad_events
alter table sky_ad_events add column github_login text;

create index idx_sky_ad_events_login on sky_ad_events(github_login)
  where github_login is not null;;
