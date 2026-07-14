-- Production advisor hardening
-- Fixes Supabase advisor warnings without reapplying divergent migration history.

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'assign_new_dev_rank',
        'complete_all_dailies',
        'find_auth_user_by_username',
        'get_auth_users_without_record',
        'get_universe_snapshot',
        'grant_streak_freeze',
        'grant_xp',
        'heartbeat_visitor',
        'increment_kudos_count',
        'increment_kudos_week',
        'increment_referral_count',
        'increment_visit_count',
        'perform_checkin',
        'recalculate_ranks',
        'record_mission_progress',
        'refresh_sky_ad_stats',
        'refresh_universe_snapshot',
        'refresh_weekly_kudos',
        'rls_auto_enable'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, auth, extensions, pg_temp',
      fn.nspname,
      fn.proname,
      fn.args
    );
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.sky_ad_daily_stats FROM PUBLIC;
REVOKE ALL ON TABLE public.sky_ad_daily_stats FROM anon;
REVOKE ALL ON TABLE public.sky_ad_daily_stats FROM authenticated;
GRANT SELECT ON TABLE public.sky_ad_daily_stats TO service_role;

DROP POLICY IF EXISTS "Service role manages sessions" ON public.company_sessions;
DROP POLICY IF EXISTS "No direct public read" ON public.company_sessions;
CREATE POLICY "No direct public read"
  ON public.company_sessions
  FOR SELECT
  TO anon, authenticated
  USING (false);

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'assign_new_dev_rank',
        'find_auth_user_by_username',
        'get_auth_users_without_record',
        'heartbeat_visitor',
        'increment_kudos_count',
        'increment_referral_count',
        'increment_visit_count',
        'recalculate_ranks',
        'refresh_sky_ad_stats',
        'rls_auto_enable'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', fn.nspname, fn.proname, fn.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon', fn.nspname, fn.proname, fn.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated', fn.nspname, fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', fn.nspname, fn.proname, fn.args);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Owner reads own purchases" ON public.purchases;
CREATE POLICY "Owner reads own purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND company_id IN (
      SELECT id FROM public.developers WHERE claimed_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owner reads own customizations" ON public.company_customizations;
CREATE POLICY "Owner reads own customizations"
  ON public.company_customizations
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND company_id IN (
      SELECT id FROM public.developers WHERE claimed_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can read own streak rewards" ON public.streak_rewards;
CREATE POLICY "Users can read own streak rewards"
  ON public.streak_rewards
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE claimed_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can read own preferences" ON public.notification_preferences;
CREATE POLICY "Users can read own preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE claimed_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE claimed_by = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE claimed_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE claimed_by = (select auth.uid())
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE claimed_by = (select auth.uid())
    )
  );
