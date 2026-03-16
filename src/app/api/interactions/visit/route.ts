import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { touchLastActive } from "@/lib/notification-helpers";
import { trackDailyMission } from "@/lib/dailies";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { planet_login } = await request.json();
  if (!planet_login || typeof planet_login !== "string") {
    return NextResponse.json({ error: "Missing planet_login" }, { status: 400 });
  }

  // Per-user rate limit
  const { ok } = rateLimit(`visit:${user.id}`, 2, 1000);
  if (!ok) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const admin = getSupabaseAdmin();

  const githubLogin = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  // Fetch visitor
  const { data: visitor } = await admin
    .from("companies")
    .select("id")
    .eq("username", githubLogin)
    .single();

  if (!visitor) {
    return NextResponse.json({ error: "Not a registered company" }, { status: 403 });
  }

  // Fetch planet owner
  const { data: planet } = await admin
    .from("companies")
    .select("id")
    .eq("username", planet_login.toLowerCase())
    .single();

  if (!planet) {
    return NextResponse.json({ error: "planet not found" }, { status: 404 });
  }

  // Track activity
  touchLastActive(visitor.id);
  trackDailyMission(visitor.id, "visit_planet");
  trackDailyMission(visitor.id, "visit_3_planets");

  // No self-visits
  if (visitor.id === planet.id) {
    return NextResponse.json({ ok: true }); // silent success
  }

  // Check daily limit (50/day)
  const today = new Date().toISOString().split("T")[0];
  const { count } = await admin
    .from("planet_visits")
    .select("visitor_id", { count: "exact", head: true })
    .eq("visitor_id", visitor.id)
    .eq("visit_date", today);

  if ((count ?? 0) >= 50) {
    return NextResponse.json({ ok: true }); // silent, no error needed
  }

  // Insert (ON CONFLICT DO NOTHING via PK constraint)
  const { error: insertError } = await admin
    .from("planet_visits")
    .insert({
      visitor_id: visitor.id,
      planet_id: planet.id,
      visit_date: today,
    });

  if (!insertError) {
    await admin.rpc("increment_visit_count", { target_dev_id: planet.id });

    // Grant XP for visiting a planet
    admin.rpc("grant_xp", { p_company_id: visitor.id, p_source: "visit", p_amount: 2 }).then();

    // Check if planet crossed visit milestone (>5 visits today)
    const { count: todayVisits } = await admin
      .from("planet_visits")
      .select("visitor_id", { count: "exact", head: true })
      .eq("planet_id", planet.id)
      .eq("visit_date", today);

    if ((todayVisits ?? 0) >= 10) {
      // Only insert once per planet per day
      const { data: existing } = await admin
        .from("activity_feed")
        .select("id")
        .eq("event_type", "visit_milestone")
        .eq("target_id", planet.id)
        .gte("created_at", `${today}T00:00:00Z`)
        .maybeSingle();

      if (!existing) {
        await admin.from("activity_feed").insert({
          event_type: "visit_milestone",
          target_id: planet.id,
          metadata: { login: planet_login.toLowerCase(), visit_count: todayVisits },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
