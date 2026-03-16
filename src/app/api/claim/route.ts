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

  const githubLogin = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  if (!githubLogin) {
    return NextResponse.json(
      { error: "No GitHub username in profile" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Check that the user hasn't already claimed a different planet
  const { data: alreadyClaimed } = await admin
    .from("companies")
    .select("username")
    .eq("claimed_by", user.id)
    .maybeSingle();

  if (alreadyClaimed) {
    return NextResponse.json(
      { error: "You have already claimed a planet" },
      { status: 409 }
    );
  }

  // Atomic claim: eq("claimed", false) + is("claimed_by", null) prevents race conditions
  const { data, error } = await admin
    .from("companies")
    .update({
      claimed: true,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      fetch_priority: 1,
    })
    .eq("username", githubLogin)
    .eq("claimed", false)
    .is("claimed_by", null)
    .select("username")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "planet not found or already claimed" },
      { status: 404 }
    );
  }

  // Insert feed event
  const { data: dev } = await admin
    .from("companies")
    .select("id")
    .eq("username", githubLogin)
    .single();

  if (dev) {
    await admin.from("activity_feed").insert({
      event_type: "planet_claimed",
      actor_id: dev.id,
      metadata: { login: githubLogin },
    });
  }

  return NextResponse.json({ claimed: true, username: data.username });
}
