import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = Math.max(0, parseInt(searchParams.get("from") ?? "0", 10));
  const to = Math.min(
    from + 1000,
    parseInt(searchParams.get("to") ?? "500", 10)
  );

  const sb = getSupabaseAdmin();

  // Round 1: companies + stats in parallel
  const [companiesResult, statsResult] = await Promise.all([
    sb
      .from("companies")
      .select(
        "id, github_login, name, avatar_url, contributions, total_stars, public_repos, category, employee_count, applications_count, rank, claimed, kudos_count, visit_count, contributions_total, contribution_years, total_prs, total_reviews, repos_contributed_to, followers, following, organizations_count, account_created_at, current_streak, active_days_last_year, language_diversity, app_streak, rabbit_completed, constellation, xp_total, xp_level, yield_percent"
      )
      .order("rank", { ascending: true })
      .range(from, to - 1),
    sb.from("Universe_stats").select("*").eq("id", 1).single(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companies = (companiesResult.data ?? []) as Record<string, any>[];
  const devIds = companies.map((d: Record<string, any>) => d.id);

  if (devIds.length === 0) {
    return NextResponse.json(
      {
        companies: [],
        stats: statsResult.data ?? { total_companies: 0, total_contributions: 0 },
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  }

  // Round 2: purchases + customizations + achievements + raid tags in parallel
  const [purchasesResult, giftPurchasesResult, customizationsResult, achievementsResult, raidTagsResult] = await Promise.all([
    sb
      .from("purchases")
      .select("company_id, item_id")
      .in("company_id", devIds)
      .is("gifted_to", null)
      .eq("status", "completed"),
    sb
      .from("purchases")
      .select("gifted_to, item_id")
      .in("gifted_to", devIds)
      .eq("status", "completed"),
    sb
      .from("company_customizations")
      .select("company_id, item_id, config")
      .in("company_id", devIds)
      .in("item_id", ["custom_color", "billboard", "loadout"]),
    sb
      .from("company_achievements")
      .select("company_id, achievement_id")
      .in("company_id", devIds),
    sb
      .from("raid_tags")
      .select("planet_id, attacker_login, tag_style, expires_at")
      .in("planet_id", devIds)
      .eq("active", true),
  ]);

  // Build owned items map (direct purchases + received gifts)
  const ownedItemsMap: Record<number, string[]> = {};
  for (const row of purchasesResult.data ?? []) {
    if (!ownedItemsMap[row.company_id]) ownedItemsMap[row.company_id] = [];
    ownedItemsMap[row.company_id].push(row.item_id);
  }
  for (const row of giftPurchasesResult.data ?? []) {
    const devId = row.gifted_to as number;
    if (!ownedItemsMap[devId]) ownedItemsMap[devId] = [];
    ownedItemsMap[devId].push(row.item_id);
  }

  // Build customization maps
  const customColorMap: Record<number, string> = {};
  const billboardImagesMap: Record<number, string[]> = {};
  const loadoutMap: Record<number, { crown: string | null; roof: string | null; aura: string | null }> = {};
  for (const row of customizationsResult.data ?? []) {
    const config = row.config as Record<string, unknown>;
    if (row.item_id === "custom_color" && typeof config?.color === "string") {
      customColorMap[row.company_id] = config.color;
    }
    if (row.item_id === "billboard") {
      if (Array.isArray(config?.images)) {
        billboardImagesMap[row.company_id] = config.images as string[];
      } else if (typeof config?.image_url === "string") {
        billboardImagesMap[row.company_id] = [config.image_url];
      }
    }
    if (row.item_id === "loadout") {
      loadoutMap[row.company_id] = {
        crown: (config?.crown as string) ?? null,
        roof: (config?.roof as string) ?? null,
        aura: (config?.aura as string) ?? null,
      };
    }
  }

  // Build achievements map
  const achievementsMap: Record<number, string[]> = {};
  for (const row of achievementsResult.data ?? []) {
    if (!achievementsMap[row.company_id]) achievementsMap[row.company_id] = [];
    achievementsMap[row.company_id].push(row.achievement_id);
  }

  // Build raid tags map (1 active tag per planet)
  const raidTagMap: Record<number, { attacker_login: string; tag_style: string; expires_at: string }> = {};
  for (const row of raidTagsResult.data ?? []) {
    raidTagMap[row.planet_id] = {
      attacker_login: row.attacker_login,
      tag_style: row.tag_style,
      expires_at: row.expires_at,
    };
  }

  // Merge everything
  const companiesWithItems = companies.map((dev) => ({
    ...dev,
    kudos_count: dev.kudos_count ?? 0,
    visit_count: dev.visit_count ?? 0,
    owned_items: ownedItemsMap[dev.id] ?? [],
    custom_color: customColorMap[dev.id] ?? null,
    billboard_images: billboardImagesMap[dev.id] ?? [],
    achievements: achievementsMap[dev.id] ?? [],
    loadout: loadoutMap[dev.id] ?? null,
    app_streak: dev.app_streak ?? 0,
    raid_xp: dev.raid_xp ?? 0,
    current_week_contributions: dev.current_week_contributions ?? 0,
    current_week_kudos_given: dev.current_week_kudos_given ?? 0,
    current_week_kudos_received: dev.current_week_kudos_received ?? 0,
    active_raid_tag: raidTagMap[dev.id] ?? null,
    rabbit_completed: dev.rabbit_completed ?? false,
    xp_total: dev.xp_total ?? 0,
    xp_level: dev.xp_level ?? 1,
  }));

  return NextResponse.json(
    {
      companies: companiesWithItems,
      stats: statsResult.data ?? {
        total_companies: 0,
        total_contributions: 0,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
