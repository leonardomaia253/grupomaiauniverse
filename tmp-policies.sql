select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
and (
  tablename in ('purchases','company_customizations','streak_rewards','notification_preferences','push_subscriptions','company_sessions')
)
order by tablename, policyname;
