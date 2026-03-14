import { getSupabaseAdmin } from "./supabase";

// ─── Types ───────────────────────────────────────────────────

export interface ShopItem {
  id: string;
  category: "effect" | "structure" | "identity" | "consumable";
  name: string;
  description: string | null;
  price_usd_cents: number;
  price_brl_cents: number;
  is_active: boolean;
  zone: "crown" | "roof" | "aura" | "faces" | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // A11: Seasonal/limited items
  available_until: string | null;
  max_quantity: number | null;
  is_exclusive: boolean;
}

export interface PurchaseRecord {
  id: string;
  company_id: number;
  item_id: string;
  provider: "stripe" | "abacatepay" | "free" | "achievement";
  provider_tx_id: string | null;
  amount_cents: number;
  currency: "usd" | "brl";
  status: "pending" | "completed" | "expired" | "refunded";
  created_at: string;
}

export type OwnedItems = string[];

// ─── Helpers ─────────────────────────────────────────────────

export async function getOwnedItems(companyId: number): Promise<string[]> {
  const sb = getSupabaseAdmin();

  // Items bought directly (not gifts to others)
  const { data: ownData } = await sb
    .from("purchases")
    .select("item_id")
    .eq("company_id", companyId)
    .is("gifted_to", null)
    .eq("status", "completed");

  // Items received as gifts
  const { data: giftData } = await sb
    .from("purchases")
    .select("item_id")
    .eq("gifted_to", companyId)
    .eq("status", "completed");

  return [...(ownData ?? []), ...(giftData ?? [])].map((row) => row.item_id);
}

/** Item granted for free when a company first claims their planet. */
export const FREE_CLAIM_ITEM = "flag";

/**
 * Grant the free claim item to a company.
 * No-ops if they already own it (idempotent).
 * Returns true if the item was granted, false if already owned.
 */
export async function grantFreeClaimItem(
  companyId: number
): Promise<boolean> {
  const sb = getSupabaseAdmin();

  // Check if already owned
  const { data: existing } = await sb
    .from("purchases")
    .select("id")
    .eq("company_id", companyId)
    .eq("item_id", FREE_CLAIM_ITEM)
    .eq("status", "completed")
    .maybeSingle();

  if (existing) return false;

  await sb.from("purchases").insert({
    company_id: companyId,
    item_id: FREE_CLAIM_ITEM,
    provider: "free",
    provider_tx_id: `free_claim_${companyId}`,
    amount_cents: 0,
    currency: "usd",
    status: "completed",
  });

  return true;
}

/**
 * Auto-equip an item if the company has only one item in its zone.
 * Called after a purchase is completed (buy or gift).
 */
export async function autoEquipIfSolo(
  companyId: number,
  itemId: string
): Promise<void> {
  const { ZONE_ITEMS } = await import("./zones");

  // Find which zone this item belongs to
  let zone: string | null = null;
  for (const [z, ids] of Object.entries(ZONE_ITEMS)) {
    if (ids.includes(itemId)) { zone = z; break; }
  }
  if (!zone) return; // faces or unknown zone, skip

  const sb = getSupabaseAdmin();

  // Get all owned items in this zone (bought by them OR gifted to them)
  const { data: ownPurchases } = await sb
    .from("purchases")
    .select("item_id")
    .eq("company_id", companyId)
    .is("gifted_to", null)
    .eq("status", "completed");
  const { data: giftPurchases } = await sb
    .from("purchases")
    .select("item_id")
    .eq("gifted_to", companyId)
    .eq("status", "completed");
  const purchases = [...(ownPurchases ?? []), ...(giftPurchases ?? [])];

  const zoneItems = ZONE_ITEMS[zone];
  const ownedInZone = (purchases ?? [])
    .map((p) => p.item_id)
    .filter((id) => zoneItems.includes(id));

  if (ownedInZone.length !== 1) return; // 0 or 2+ items, don't auto-equip

  // Get current loadout
  const { data: existing } = await sb
    .from("company_customizations")
    .select("config")
    .eq("company_id", companyId)
    .eq("item_id", "loadout")
    .maybeSingle();

  const config = (existing?.config ?? { crown: null, roof: null, aura: null }) as Record<string, string | null>;
  config[zone] = itemId;

  await sb.from("company_customizations").upsert(
    {
      company_id: companyId,
      item_id: "loadout",
      config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,item_id" }
  );
}

export async function getOwnedItemsForcompanies(
  companyIds: number[]
): Promise<Record<number, string[]>> {
  if (companyIds.length === 0) return {};

  const sb = getSupabaseAdmin();

  // Items bought directly (not gifts)
  const { data: ownData } = await sb
    .from("purchases")
    .select("company_id, item_id")
    .in("company_id", companyIds)
    .is("gifted_to", null)
    .eq("status", "completed");

  // Items received as gifts
  const { data: giftData } = await sb
    .from("purchases")
    .select("gifted_to, item_id")
    .in("gifted_to", companyIds)
    .eq("status", "completed");

  const result: Record<number, string[]> = {};
  for (const row of ownData ?? []) {
    if (!result[row.company_id]) result[row.company_id] = [];
    result[row.company_id].push(row.item_id);
  }
  for (const row of giftData ?? []) {
    const devId = row.gifted_to as number;
    if (!result[devId]) result[devId] = [];
    result[devId].push(row.item_id);
  }
  return result;
}
