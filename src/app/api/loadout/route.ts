import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ZONE_ITEMS } from "@/lib/zones";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const devId = searchParams.get("company_id");

  if (!devId) {
    return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("company_customizations")
    .select("config")
    .eq("company_id", parseInt(devId, 10))
    .eq("item_id", "loadout")
    .maybeSingle();

  return NextResponse.json({
    loadout: data?.config ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const githubLogin = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  const { data: dev } = await admin
    .from("companies")
    .select("id, claimed, claimed_by")
    .eq("username", githubLogin)
    .single();

  if (!dev || !dev.claimed || dev.claimed_by !== user.id) {
    return NextResponse.json({ error: "Must own a claimed planet" }, { status: 403 });
  }

  const body = await request.json();
  const { crown, roof, aura } = body as {
    crown?: string | null;
    roof?: string | null;
    aura?: string | null;
  };

  // Fetch owned items
  const { data: purchases } = await admin
    .from("purchases")
    .select("item_id")
    .eq("company_id", dev.id)
    .eq("status", "completed");

  const ownedSet = new Set((purchases ?? []).map((p) => p.item_id));

  // Validate each equipped item is owned and belongs to the correct zone
  const config: Record<string, string | null> = { crown: null, roof: null, aura: null };

  for (const [zone, itemId] of [
    ["crown", crown],
    ["roof", roof],
    ["aura", aura],
  ] as const) {
    if (itemId === null || itemId === undefined) {
      config[zone] = null;
      continue;
    }
    if (!ZONE_ITEMS[zone]?.includes(itemId)) {
      return NextResponse.json(
        { error: `${itemId} is not valid for zone ${zone}` },
        { status: 400 }
      );
    }
    if (!ownedSet.has(itemId)) {
      return NextResponse.json(
        { error: `You don't own ${itemId}` },
        { status: 403 }
      );
    }
    config[zone] = itemId;
  }

  // Get current loadout to detect changes
  const { data: currentLoadout } = await admin
    .from("company_customizations")
    .select("config")
    .eq("company_id", dev.id)
    .eq("item_id", "loadout")
    .maybeSingle();
  const prev = (currentLoadout?.config ?? { crown: null, roof: null, aura: null }) as Record<string, string | null>;

  // Upsert loadout
  await admin.from("company_customizations").upsert(
    {
      company_id: dev.id,
      item_id: "loadout",
      config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,item_id" }
  );

  // Feed event for newly equipped items
  for (const zone of ["crown", "roof", "aura"] as const) {
    if (config[zone] && config[zone] !== prev[zone]) {
      await admin.from("activity_feed").insert({
        event_type: "item_equipped",
        actor_id: dev.id,
        metadata: { login: githubLogin, item_id: config[zone], zone },
      });
      break; // One event per save to avoid spam
    }
  }

  return NextResponse.json({ ok: true, loadout: config });
}
