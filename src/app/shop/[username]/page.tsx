import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOwnedItems } from "@/lib/items";
import type { ShopItem } from "@/lib/items";
import { calcPlanetDims } from "@/lib/github";
import ShopClient from "@/components/ShopClient";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ purchased?: string; gifted?: string; to?: string }>;
}

async function getCompany(username: string) {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("companies")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();
  return data;
}

async function getActiveItems(): Promise<ShopItem[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("items")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("price_usd_cents");
  return (data ?? []) as ShopItem[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const record = await getCompany(username);

  if (!record) {
    return { title: "Company Not Found - Maia Universe" };
  }

  return {
    title: `Shop - @${record.username} - Maia Universe`,
    description: `Customize @${record.username}'s planet in Maia Universe`,
  };
}

const ACCENT = "#c8e64a";

export default async function ShopPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { purchased: purchasedItem, gifted: giftedItem, to: giftedTo } = await searchParams;
  const record = await getCompany(username);

  if (!record) notFound();

  // Check if the logged-in user owns this planet
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const authLogin = (
    user?.user_metadata?.user_name ??
    user?.user_metadata?.preferred_username ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    ""
  ).toLowerCase();
  const isOwner = !!user && authLogin === record.username.toLowerCase();

  // Not the owner or not claimed — show message
  if (!record.claimed || !isOwner) {
    return (
      <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
        <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
          <Link
            href={`/dev/${record.username}`}
            className="mb-6 inline-block text-sm text-muted transition-colors hover:text-cream sm:mb-8"
          >
            &larr; Back to Profile
          </Link>

          <div className="border-[3px] border-border bg-bg-raised p-6 text-center sm:p-10">
            <h1 className="text-lg text-cream">Shop Locked</h1>
            <p className="mt-3 text-[10px] text-muted normal-case">
              {!record.claimed
                ? `@${record.username} needs to claim their planet before the shop is available.`
                : "Only the planet owner can customize it. Sign in with the matching account."}
            </p>
            <Link
              href={`/dev/${record.username}`}
              className="btn-press mt-5 inline-block px-6 py-3 text-xs text-bg"
              style={{
                backgroundColor: ACCENT,
                boxShadow: "3px 3px 0 0 #5a7a00",
              }}
            >
              View Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sb = getSupabaseAdmin();

  const [items, ownedItems, customizationsResult, billboardPurchasesResult, topDevResult, topStarsResult, achievementsResult, loadoutResult, raidLoadoutResult, allPurchasesResult] = await Promise.all([
    getActiveItems(),
    getOwnedItems(record.id),
    sb
      .from("company_customizations")
      .select("item_id, config")
      .eq("company_id", record.id)
      .in("item_id", ["custom_color", "billboard"]),
    sb
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("company_id", record.id)
      .eq("item_id", "billboard")
      .eq("status", "completed"),
    sb
      .from("companies")
      .select("contributions")
      .order("rank", { ascending: true })
      .limit(1)
      .single(),
    sb
      .from("companies")
      .select("total_stars")
      .order("total_stars", { ascending: false })
      .limit(1)
      .single(),
    sb
      .from("company_achievements")
      .select("achievement_id")
      .eq("company_id", record.id),
    sb
      .from("company_customizations")
      .select("config")
      .eq("company_id", record.id)
      .eq("item_id", "loadout")
      .maybeSingle(),
    sb
      .from("company_customizations")
      .select("config")
      .eq("company_id", record.id)
      .eq("item_id", "raid_loadout")
      .maybeSingle(),
    // A10+A13: Count purchases per item for popularity badges + social proof
    sb
      .from("purchases")
      .select("item_id, created_at")
      .eq("status", "completed"),
  ]);

  const achievements = (achievementsResult.data ?? []).map((a: { achievement_id: string }) => a.achievement_id);

  // A10: Compute top 3 most purchased items (min 5 purchases)
  const purchaseCounts: Record<string, number> = {};
  const weeklyPurchaseCounts: Record<string, number> = {};
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const p of allPurchasesResult.data ?? []) {
    purchaseCounts[p.item_id] = (purchaseCounts[p.item_id] ?? 0) + 1;
    if (new Date(p.created_at).getTime() > weekAgo) {
      weeklyPurchaseCounts[p.item_id] = (weeklyPurchaseCounts[p.item_id] ?? 0) + 1;
    }
  }
  const popularItems = Object.entries(purchaseCounts)
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
  const initialLoadout = (loadoutResult.data?.config as { crown: string | null; roof: string | null; aura: string | null } | null) ?? null;

  const billboardSlots = billboardPurchasesResult.count ?? 0;
  const maxContrib = topDevResult.data?.contributions ?? record.contributions;
  const maxStars = topStarsResult.data?.total_stars ?? record.total_stars;
  const planetDims = calcPlanetDims(
    record.username,
    record.contributions,
    record.public_repos,
    record.total_stars,
    maxContrib,
    maxStars,
  );

  // Extract customization values
  let initialCustomColor: string | null = null;
  let initialBillboardImages: string[] = [];
  for (const row of customizationsResult.data ?? []) {
    const config = row.config as Record<string, unknown>;
    if (row.item_id === "custom_color" && typeof config?.color === "string") {
      initialCustomColor = config.color;
    }
    if (row.item_id === "billboard") {
      // Support both new array format and legacy single image
      if (Array.isArray(config?.images)) {
        initialBillboardImages = config.images as string[];
      } else if (typeof config?.image_url === "string") {
        initialBillboardImages = [config.image_url];
      }
    }
  }

  return (
    <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
      <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10 lg:max-w-240">
        {/* Header */}
        <Link
          href={`/dev/${record.username}`}
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-cream sm:mb-8"
        >
          &larr; Back to Profile
        </Link>

        {/* Profile mini-card */}
        <div className="mb-5 border-[3px] border-border bg-bg-raised p-4 sm:p-6">
          <div className="flex items-center gap-4">
            {record.avatar_url && (
              <Image
                src={record.avatar_url}
                alt={record.username}
                width={56}
                height={56}
                className="border-2 border-border shrink-0"
                style={{ imageRendering: "pixelated" }}
              />
            )}
            <div>
              <h1 className="text-lg text-cream">Shop</h1>
              <p className="mt-0.5 text-[10px] text-muted normal-case">
                Customize @{record.username}&apos;s planet
              </p>
            </div>
          </div>
        </div>

        {/* Shop items (client component) */}
        <ShopClient
          username={record.username}
          companyId={record.id}
          items={items}
          ownedItems={ownedItems}
          initialCustomColor={initialCustomColor}
          initialBillboardImages={initialBillboardImages}
          billboardSlots={billboardSlots}
          planetDims={planetDims}
          achievements={achievements}
          initialLoadout={initialLoadout}
          initialRaidLoadout={(raidLoadoutResult?.data?.config as { vehicle: string; tag: string }) ?? null}
          purchasedItem={purchasedItem ?? null}
          giftedItem={giftedItem ?? null}
          giftedTo={giftedTo ?? null}
          streakFreezesAvailable={record.streak_freezes_available ?? 0}
          popularItems={popularItems}
          purchaseCounts={weeklyPurchaseCounts}
          totalPurchaseCounts={purchaseCounts}
        />

        {/* Back links */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
          <Link
            href={`/dev/${record.username}`}
            className="text-xs text-muted transition-colors hover:text-cream normal-case"
          >
            View profile &rarr;
          </Link>
          <Link
            href={`/?user=${record.username}`}
            className="text-xs text-muted transition-colors hover:text-cream normal-case"
          >
            View in universe &rarr;
          </Link>
        </div>

        {/* Creator credit */}
        <div className="mt-10 border-t border-border/50 pt-4 text-center">
          <p className="text-[9px] text-muted normal-case">
            built by{" "}
            <a
              href="https://x.com/leonardomaia253"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
              style={{ color: ACCENT }}
            >
              @leonardomaia253
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
