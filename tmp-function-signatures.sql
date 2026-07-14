select n.nspname as schema, p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
and p.proname in (
  'recalculate_ranks','find_auth_user_by_username','get_auth_users_without_record','heartbeat_visitor','refresh_universe_snapshot','increment_kudos_count','increment_visit_count','increment_referral_count','perform_checkin','increment_kudos_week','refresh_sky_ad_stats','grant_streak_freeze','refresh_weekly_kudos','record_mission_progress','complete_all_dailies','assign_new_dev_rank','grant_xp','get_universe_snapshot','rls_auto_enable'
)
order by p.proname, args;
