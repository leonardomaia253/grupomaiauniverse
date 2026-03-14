import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Find the company record claimed by this auth user
  const { data: dev, error: devErr } = await admin
    .from("companies")
    .select("id")
    .eq("claimed_by", user.id)
    .single();

  if (devErr || !dev) {
    // No claimed planet — just delete the auth user
    await admin.auth.admin.deleteUser(user.id);
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  }

  const devId = dev.id;

  // Delete personal data in dependency order
  await Promise.all([
    admin.from("activity_feed").delete().or(`actor_id.eq.${devId},target_id.eq.${devId}`),
    admin.from("xp_log").delete().eq("company_id", devId),
    admin.from("daily_mission_progress").delete().eq("company_id", devId),
    admin.from("fly_scores").delete().eq("company_id", devId),
    admin.from("streak_freeze_log").delete().eq("company_id", devId),
    admin.from("streak_checkins").delete().eq("company_id", devId),
    admin.from("company_kudos").delete().or(`giver_id.eq.${devId},receiver_id.eq.${devId}`),
    admin.from("planet_visits").delete().or(`visitor_id.eq.${devId},planet_id.eq.${devId}`),
    admin.from("company_achievements").delete().eq("company_id", devId),
    admin.from("company_customizations").delete().eq("company_id", devId),
    admin.from("purchases").delete().eq("company_id", devId),
    admin.from("notification_preferences").delete().eq("company_id", devId),
    admin.from("notification_log").delete().eq("company_id", devId),
    admin.from("notification_batches").delete().eq("company_id", devId),
    admin.from("push_subscriptions").delete().eq("company_id", devId),
  ]);

  // Null out gifted_to references from other users' purchases pointing to this dev
  await admin.from("purchases").update({ gifted_to: null }).eq("gifted_to", devId);

  // Raids: delete tags first, then raids themselves
  await admin.from("raid_tags").delete().or(`planet_id.eq.${devId},attacker_id.eq.${devId}`);
  await admin.from("raids").delete().or(`attacker_id.eq.${devId},defender_id.eq.${devId}`);

  // Delete the company row (removes the planet from the Universe entirely)
  await admin.from("companies").delete().eq("id", devId);

  // Delete the auth user
  await admin.auth.admin.deleteUser(user.id);

  // Sign out the session
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
