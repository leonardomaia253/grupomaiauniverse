import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

const VALID_constellationS = [
  "frontend", "backend", "fullstack", "mobile", "data_ai",
  "devops", "security", "gamedev", "vibe_coder", "creator",
];

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ok } = rateLimit(`constellation:${user.id}`, 2, 60_000);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const constellation_id = body.constellation_id as string;

  if (!constellation_id || !VALID_constellationS.includes(constellation_id)) {
    return NextResponse.json({ error: "Invalid constellation" }, { status: 400 });
  }

  // Fetch company
  const login = user.user_metadata?.user_name?.toLowerCase();
  if (!login) {
    return NextResponse.json({ error: "No GitHub login found" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: dev, error: devError } = await admin
    .from("companies")
    .select("id, claimed, constellation, constellation_chosen, constellation_changes_count, constellation_changed_at")
    .eq("github_login", login)
    .single();

  if (devError || !dev) {
    return NextResponse.json({ error: "company not found" }, { status: 404 });
  }

  if (!dev.claimed) {
    return NextResponse.json({ error: "You must claim your planet first" }, { status: 403 });
  }

  const oldconstellation = dev.constellation;
  const isFirstChoice = !dev.constellation_chosen;
  const isActualChange = oldconstellation !== null && oldconstellation !== constellation_id;

  // Same constellation = no-op, just confirm
  if (oldconstellation === constellation_id) {
    await admin
      .from("companies")
      .update({ constellation_chosen: true })
      .eq("id", dev.id);
    return NextResponse.json({ ok: true, constellation: constellation_id });
  }

  // Business rules only apply to real changes (not first choice)
  if (!isFirstChoice) {
    if ((dev.constellation_changes_count ?? 0) >= 2) {
      return NextResponse.json(
        { error: "Paid constellation changes coming soon" },
        { status: 403 },
      );
    }

    if (dev.constellation_changed_at) {
      const lastChange = new Date(dev.constellation_changed_at).getTime();
      const cooldownMs = 90 * 24 * 60 * 60 * 1000;
      const remaining = lastChange + cooldownMs - Date.now();
      if (remaining > 0) {
        const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
        return NextResponse.json(
          { error: `Cooldown: wait ${days} days` },
          { status: 429 },
        );
      }
    }
  }

  // Update company
  const { error: updateError } = await admin
    .from("companies")
    .update({
      constellation: constellation_id,
      constellation_chosen: true,
      // Only count actual changes, not first choice
      constellation_changes_count: isActualChange
        ? (dev.constellation_changes_count ?? 0) + 1
        : (dev.constellation_changes_count ?? 0),
      constellation_changed_at: isActualChange
        ? new Date().toISOString()
        : dev.constellation_changed_at,
    })
    .eq("id", dev.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update constellation" }, { status: 500 });
  }

  // Log the change
  await admin.from("constellation_changes").insert({
    company_id: dev.id,
    from_constellation: oldconstellation,
    to_constellation: constellation_id,
    reason: "user_choice",
  });

  // Update constellation population counts
  if (oldconstellation) {
    const { data: oldDist } = await admin
      .from("constellations")
      .select("population")
      .eq("id", oldconstellation)
      .single();
    if (oldDist) {
      await admin
        .from("constellations")
        .update({ population: Math.max(0, (oldDist.population ?? 0) - 1) })
        .eq("id", oldconstellation);
    }
  }

  const { data: newDist } = await admin
    .from("constellations")
    .select("population")
    .eq("id", constellation_id)
    .single();
  if (newDist) {
    await admin
      .from("constellations")
      .update({ population: (newDist.population ?? 0) + 1 })
      .eq("id", constellation_id);
  }

  return NextResponse.json({ ok: true, constellation: constellation_id });
}
