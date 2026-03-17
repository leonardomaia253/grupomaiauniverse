/**
 * One-shot snapshot generator.
 * Run with: node scripts/generate-snapshot.mjs
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_PROXY_SECRET
 */
import { readFileSync } from "fs";
import { gzipSync } from "zlib";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually
const envFile = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_SECRET = env.ADMIN_PROXY_SECRET;
const STORAGE_BUCKET = "Universe-data";
const STORAGE_PATH = "snapshot.json";
const PAGE_SIZE = 1000;

if (!SUPABASE_URL || !ANON_KEY || !ADMIN_SECRET) {
  console.error("Missing required env vars. Check .env.local");
  process.exit(1);
}

// Create a proxied admin Supabase client (mirrors ../src/lib/supabase.ts getSupabaseAdmin)
const sb = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
  global: {
    fetch: async (url, options) => {
      const proxyUrl = `${SUPABASE_URL}/functions/v1/admin-proxy`;
      const newHeaders = new Headers(options?.headers ?? {});
      newHeaders.set("x-admin-proxy-secret", ADMIN_SECRET);
      newHeaders.set("x-target-url", url.toString());
      return fetch(proxyUrl, { ...options, headers: newHeaders });
    },
  },
});

async function fetchAll(table, select, apply, orderBy) {
  const all = [];
  let from = 0;
  while (true) {
    let q = sb.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (orderBy) q = q.order(orderBy, { ascending: true });
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) throw new Error(`fetchAll ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function main() {
  console.log("Fetching data from Supabase via admin-proxy...");
  const started = Date.now();

  const [companies, purchases, giftPurchases, customizations, achievements, raidTags, statsResult] =
    await Promise.all([
      fetchAll(
        "companies",
        "id, username, name, avatar_url, contributions, total_stars, public_repos, primary_language, rank, claimed, kudos_count, visit_count, contributions_total, contribution_years, total_prs, total_reviews, repos_contributed_to, followers, following, organizations_count, account_created_at, current_streak, active_days_last_year, language_diversity, app_streak, rabbit_completed, district, district_chosen, xp_total, xp_level",
        undefined,
        "rank",
      ),
      fetchAll("purchases", "company_id, item_id", (q) => q.is("gifted_to", null).eq("status", "completed")),
      fetchAll("purchases", "gifted_to, item_id", (q) => q.not("gifted_to", "is", null).eq("status", "completed")),
      fetchAll("company_customizations", "company_id, item_id, config", (q) => q.in("item_id", ["custom_color", "billboard", "loadout"])),
      fetchAll("company_achievements", "company_id, achievement_id"),
      fetchAll("raid_tags", "planet_id, attacker_login, tag_style, expires_at", (q) => q.eq("active", true)),
      sb.from("universe_stats").select("*").eq("id", 1).single(),
    ]);

  console.log(`Fetched ${companies.length} companies`);

  // Build maps
  const ownedItemsMap = {};
  for (const r of purchases) (ownedItemsMap[r.company_id] ??= []).push(r.item_id);
  for (const r of giftPurchases) (ownedItemsMap[r.gifted_to] ??= []).push(r.item_id);

  const customColorMap = {}, billboardImagesMap = {}, loadoutMap = {};
  for (const r of customizations) {
    const c = r.config;
    if (r.item_id === "custom_color" && typeof c?.color === "string") customColorMap[r.company_id] = c.color;
    if (r.item_id === "billboard") {
      if (Array.isArray(c?.images)) billboardImagesMap[r.company_id] = c.images;
      else if (typeof c?.image_url === "string") billboardImagesMap[r.company_id] = [c.image_url];
    }
    if (r.item_id === "loadout") loadoutMap[r.company_id] = { crown: c?.crown ?? null, roof: c?.roof ?? null, aura: c?.aura ?? null };
  }

  const achievementsMap = {};
  for (const r of achievements) (achievementsMap[r.company_id] ??= []).push(r.achievement_id);

  const raidTagMap = {};
  for (const r of raidTags) raidTagMap[r.planet_id] = { attacker_login: r.attacker_login, tag_style: r.tag_style, expires_at: r.expires_at };

  const mergedCompanies = companies.map((dev) => ({
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
    companies: mergedCompanies,
    stats: statsResult.data ?? { total_companies: 0, total_contributions: 0 },
    generated_at: new Date().toISOString(),
  });

  const compressed = gzipSync(Buffer.from(snapshot));
  console.log(`Snapshot size: ${Math.round(compressed.length / 1024)}KB (uncompressed: ${Math.round(snapshot.length / 1024)}KB)`);

  console.log("Uploading to Supabase Storage...");
  const { error: uploadError } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(STORAGE_PATH, compressed, {
      contentType: "application/gzip",
      upsert: true,
      cacheControl: "no-cache",
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError.message);
    process.exit(1);
  }

  console.log(`Done! Took ${Date.now() - started}ms`);
  console.log(`Snapshot available at: ${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
