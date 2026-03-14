import { NextRequest, NextResponse } from "next/server";
import { gzipSync } from "zlib";
import { getSupabaseAdmin } from "@/lib/supabase";

export const maxDuration = 300;

const STORAGE_BUCKET = "Universe-data";
const STORAGE_PATH = "snapshot.json";
const PAGE_SIZE = 1000; // Supabase PostgREST caps at 1000 rows per request

/** Paginate through all rows of a table. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(
  sb: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  select: string,
  apply?: (q: any) => any,
  orderBy?: string,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    let q: any = sb.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (orderBy) q = q.order(orderBy, { ascending: true });
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) throw new Error(`fetchAll ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const sb = getSupabaseAdmin();

  // Ensure public bucket exists (idempotent)
  await sb.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  // Fetch everything in parallel
  const [companies, purchases, giftPurchases, customizations, achievements, raidTags, statsResult] =
    await Promise.all([
      fetchAll<Record<string, any>>(
        sb,
        "companies",
        "id, github_login, name, avatar_url, contributions, total_stars, public_repos, primary_language, rank, claimed, kudos_count, visit_count, contributions_total, contribution_years, total_prs, total_reviews, repos_contributed_to, followers, following, organizations_count, account_created_at, current_streak, active_days_last_year, language_diversity, app_streak, rabbit_completed, constellation, constellation_chosen, xp_total, xp_level",
        undefined,
        "rank",
      ),
      fetchAll<{ company_id: number; item_id: string }>(
        sb,
        "purchases",
        "company_id, item_id",
        (q) => q.is("gifted_to", null).eq("status", "completed"),
      ),
      fetchAll<{ gifted_to: number; item_id: string }>(
        sb,
        "purchases",
        "gifted_to, item_id",
        (q) => q.not("gifted_to", "is", null).eq("status", "completed"),
      ),
      fetchAll<{ company_id: number; item_id: string; config: Record<string, unknown> }>(
        sb,
        "company_customizations",
        "company_id, item_id, config",
        (q) => q.in("item_id", ["custom_color", "billboard", "loadout"]),
      ),
      fetchAll<{ company_id: number; achievement_id: string }>(
        sb,
        "company_achievements",
        "company_id, achievement_id",
      ),
      fetchAll<{ planet_id: number; attacker_login: string; tag_style: string; expires_at: string }>(
        sb,
        "raid_tags",
        "planet_id, attacker_login, tag_style, expires_at",
        (q) => q.eq("active", true),
      ),
      sb.from("Universe_stats").select("*").eq("id", 1).single(),
    ]);

  // Build owned items map
  const ownedItemsMap: Record<number, string[]> = {};
  for (const row of purchases) {
    (ownedItemsMap[row.company_id] ??= []).push(row.item_id);
  }
  for (const row of giftPurchases) {
    (ownedItemsMap[row.gifted_to] ??= []).push(row.item_id);
  }

  // Build customization maps
  const customColorMap: Record<number, string> = {};
  const billboardImagesMap: Record<number, string[]> = {};
  const loadoutMap: Record<number, { crown: string | null; roof: string | null; aura: string | null }> = {};
  for (const row of customizations) {
    const config = row.config;
    if (row.item_id === "custom_color" && typeof config?.color === "string") {
      customColorMap[row.company_id] = config.color as string;
    }
    if (row.item_id === "billboard") {
      if (Array.isArray(config?.images)) {
        billboardImagesMap[row.company_id] = config.images as string[];
      } else if (typeof config?.image_url === "string") {
        billboardImagesMap[row.company_id] = [config.image_url as string];
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
  for (const row of achievements) {
    (achievementsMap[row.company_id] ??= []).push(row.achievement_id);
  }

  // Build raid tags map
  const raidTagMap: Record<number, { attacker_login: string; tag_style: string; expires_at: string }> = {};
  for (const row of raidTags) {
    raidTagMap[row.planet_id] = {
      attacker_login: row.attacker_login,
      tag_style: row.tag_style,
      expires_at: row.expires_at,
    };
  }

  // Merge
  const companies = companies.map((dev) => ({
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

  const snapshot = JSON.stringify({
    companies,
    stats: statsResult.data ?? { total_companies: 0, total_contributions: 0 },
    generated_at: new Date().toISOString(),
  });

  const compressed = gzipSync(Buffer.from(snapshot));

  // Upload gzip bytes directly via Supabase SDK (avoids Content-Encoding issues).
  // The frontend decompresses with DecompressionStream.
  const { error: uploadError } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(STORAGE_PATH, compressed, {
      contentType: "application/gzip",
      upsert: true,
      cacheControl: "no-cache",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    companies: companies.length,
    size_kb: Math.round(compressed.length / 1024),
    uncompressed_kb: Math.round(snapshot.length / 1024),
    duration_ms: Date.now() - started,
  });
}
