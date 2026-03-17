import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOwnedItems } from "@/lib/items";
import { TIER_COLORS } from "@/lib/achievements";
import { CONSTELLATION_NAMES, CONSTELLATION_COLORS } from "@/lib/github";
import { ITEM_NAMES } from "@/lib/zones";
import { rankFromLevel, tierFromLevel, levelProgress, xpForLevel } from "@/lib/xp";
import ClaimButton from "@/components/ClaimButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import ShareButtons from "@/components/ShareButtons";
import CompareChallenge from "@/components/CompareChallenge";
import ReferralCTA from "@/components/ReferralCTA";
import ProfileTracker from "@/components/ProfileTracker";

export const revalidate = 3600; // ISR: regenerate every 1 hour

interface Props {
  params: Promise<{ username: string }>;
}

const getCompany = cache(async (username: string) => {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const dev = await getCompany(username);

  if (!dev) {
    return { title: "Empresa não encontrada - Maia Universe" };
  }

  const contribs = (dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions;
  const title = `@${dev.username} - Maia Universe | ${contribs.toLocaleString()} contribuições`;
  const description = `Veja o planeta de @${dev.username} no Maia Universe. ${contribs.toLocaleString()} contribuições, ${dev.public_repos.toLocaleString()} repositórios, ${dev.total_stars.toLocaleString()} estrelas. Rank #${dev.rank ?? "?"} no universo.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@leonardomaia253",
      site: "@leonardomaia253",
    },
  };
}

interface AchievementRow {
  achievement_id: string;
  name: string;
  tier: string;
}

export default async function DevPage({ params }: Props) {
  const { username } = await params;
  const dev = await getCompany(username);

  if (!dev) notFound();

  const accent = "#c8e64a";
  const shadow = "#5a7a00";
  const ownedItems = await getOwnedItems(dev.id);

  // Fetch achievements with name+tier from DB (no hardcoded maps)
  const sb = getSupabaseAdmin();
  const { data: devAchievements } = await sb
    .from("company_achievements")
    .select("achievement_id, achievements(name, tier)")
    .eq("company_id", dev.id);
  const achievements: AchievementRow[] = (devAchievements ?? []).map((a: Record<string, unknown>) => ({
    achievement_id: a.achievement_id as string,
    name: (a.achievements as Record<string, unknown>)?.name as string ?? (a.achievement_id as string),
    tier: (a.achievements as Record<string, unknown>)?.tier as string ?? "bronze",
  }));

  // Fetch referred companies (who this dev brought to the city)
  const { data: referredDevs } = await sb
    .from("companies")
    .select("username, avatar_url")
    .eq("referred_by", dev.username)
    .order("claimed_at", { ascending: false })
    .limit(20);

  // Check if the logged-in user owns this planet
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const authLogin = (
    user?.user_metadata?.user_name ??
    user?.user_metadata?.preferred_username ??
    ""
  ).toLowerCase();
  const isOwner = !!user && authLogin === dev.username.toLowerCase() && dev.claimed;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: dev.name ?? dev.username,
      alternateName: dev.username,
      image: dev.avatar_url,
      url: `${baseUrl}/dev/${dev.username}`,
      sameAs: `https://github.com/${dev.username}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Maia Universe", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: `@${dev.username}`,
        item: `${baseUrl}/dev/${dev.username}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
      <ProfileTracker login={dev.username} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
        {/* Header */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-cream sm:mb-8"
        >
          &larr; Voltar para o Universo
        </Link>

        {/* Profile Card */}
        <div className="border-[3px] border-border bg-bg-raised p-4 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar */}
            {dev.avatar_url && (
              <Image
                src={dev.avatar_url}
                alt={dev.username}
                width={100}
                height={100}
                className="border-[3px] border-border shrink-0"
                style={{ imageRendering: "pixelated" }}
              />
            )}

            <div className="flex-1 text-center sm:text-left">
              {dev.name && (
                <h1 className="text-xl text-cream sm:text-2xl">{dev.name}</h1>
              )}
              <p className="mt-1 text-sm text-muted">@{dev.username}</p>

              {/* Rank Badge */}
              {dev.rank && (
                <div className="mt-3 inline-block border-2 px-3 py-1 text-sm" style={{ borderColor: accent, color: accent }}>
                  #{dev.rank} no universo
                </div>
              )}

              {/* Constellation badge */}
              {dev.category && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] text-bg"
                    style={{ backgroundColor: CONSTELLATION_COLORS[dev.category] ?? '#888' }}
                  >
                    {CONSTELLATION_NAMES[dev.category] ?? dev.category}
                  </span>
                </div>
              )}

              {/* Claim */}
              <div className="mt-3">
                <ClaimButton companyLogin={dev.username} claimed={dev.claimed ?? false} />
              </div>
            </div>
          </div>

          {/* Bio */}
          {dev.bio && (
            <p className="mt-5 text-sm leading-relaxed text-muted normal-case">
              {dev.bio}
            </p>
          )}
        </div>

        {/* XP & Level */}
        {(() => {
          const xpLevel = dev.xp_level ?? 1;
          const xpTotal = dev.xp_total ?? 0;
          const tier = tierFromLevel(xpLevel);
          const rank = rankFromLevel(xpLevel);
          const progress = levelProgress(xpTotal);
          const xpCurrent = xpTotal - xpForLevel(xpLevel);
          const xpNeeded = xpForLevel(xpLevel + 1) - xpForLevel(xpLevel);
          return (
            <div className="mt-5 border-[3px] border-border bg-bg-raised p-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center border-2 text-lg font-bold"
                  style={{ borderColor: tier.color, color: tier.color }}
                >
                  {xpLevel}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: tier.color }}>
                      {rank.title}
                    </span>
                    <span
                      className="px-1.5 py-0.5 text-[8px] font-bold"
                      style={{ backgroundColor: tier.color + "22", color: tier.color }}
                    >
                      {tier.name.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.25 flex-1 bg-border">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.max(2, Math.round(progress * 100))}%`,
                          backgroundColor: tier.color,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted whitespace-nowrap">
                      {xpCurrent.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-right text-[9px] text-muted">
                {xpTotal.toLocaleString()} XP total
              </div>
            </div>
          );
        })()}

        {/* View in City (prominent) */}
        <div className="mt-5">
          <Link
            href={`/?user=${dev.username}`}
            className="btn-press flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm text-bg"
            style={{
              backgroundColor: accent,
              boxShadow: `4px 4px 0 0 ${shadow}`,
            }}
          >
            Ver no Universo
          </Link>
        </div>

        {/* Customize Planet — only for the logged-in owner */}
        {isOwner && (
          <div className="mt-3">
            <Link
              href={`/shop/${dev.username}`}
              className="btn-press flex w-full items-center justify-center gap-2 border-[3px] border-border px-6 py-3 text-sm text-cream transition-colors hover:border-border-light"
            >
              Personalizar Planeta
            </Link>
          </div>
        )}

        {/* Share + Compare */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ShareButtons
              login={dev.username}
              contributions={(dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions}
              rank={dev.rank}
              accent={accent}
              shadow={shadow}
            />
          </div>
          <CompareChallenge login={dev.username} accent={accent} shadow={shadow} />
        </div>

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Contributions", value: ((dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions).toLocaleString() },
            { label: "Repos", value: dev.public_repos.toLocaleString() },
            { label: "Stars", value: dev.total_stars.toLocaleString() },
            { label: "Kudos", value: (dev.kudos_count ?? 0).toLocaleString() },
            { label: "Visits", value: (dev.visit_count ?? 0).toLocaleString() },
            { label: "Referrals", value: (dev.referral_count ?? 0).toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border-[3px] border-border bg-bg-card p-4 text-center"
            >
              <div className="text-xl" style={{ color: accent }}>
                {stat.value}
              </div>
              <div className="mt-2 text-xs text-muted">
                {stat.label === "Contributions" ? "Contribuições" :
                 stat.label === "Repos" ? "Repositórios" :
                 stat.label === "Stars" ? "Estrelas" :
                 stat.label === "Referrals" ? "Convites" :
                 stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-3 text-sm text-cream">
              Achievements
              <span className="ml-2 text-[10px] text-muted">{achievements.length}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {achievements
                .sort((a, b) => {
                  const tierOrder = ["diamond", "gold", "silver", "bronze"];
                  return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
                })
                .map((ach) => {
                  const color = TIER_COLORS[ach.tier] ?? accent;
                  return (
                    <span
                      key={ach.achievement_id}
                      className="border-2 px-3 py-1 text-[10px]"
                      style={{ borderColor: color, color }}
                    >
                      {ach.name}
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        {/* Owned Items */}
        {ownedItems.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-3 text-sm text-cream">Itens do Planeta</h2>
            <div className="flex flex-wrap gap-2">
              {ownedItems.map((itemId) => (
                <span
                  key={itemId}
                  className="border-2 px-3 py-1 text-[10px]"
                  style={{ borderColor: accent, color: accent }}
                >
                  {ITEM_NAMES[itemId] ?? itemId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Referral CTA — only for the logged-in owner */}
        {isOwner && (
          <div className="mt-5">
            <ReferralCTA login={dev.username} accent={accent} />
          </div>
        )}

        {/* Referred Companies */}
        {referredDevs && referredDevs.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-3 text-sm text-cream">
              Empresas Convidadas
              <span className="ml-2 text-[10px] text-muted">{dev.referral_count ?? referredDevs.length}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {referredDevs.map((rd) => (
                <Link
                  key={rd.username}
                  href={`/dev/${rd.username}`}
                  className="flex items-center gap-2 border-2 border-border px-3 py-1.5 text-[10px] text-muted transition-colors hover:border-border-light hover:text-cream"
                >
                  {rd.avatar_url && (
                    <Image
                      src={rd.avatar_url}
                      alt={rd.username}
                      width={16}
                      height={16}
                      className="border border-border"
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                  @{rd.username}
                </Link>
              ))}
            </div>
          </div>
        )}


        {/* Danger Zone — owner only */}
        {isOwner && (
          <div className="mt-8 border-[3px] border-red-500/40 p-5">
            <h2 className="text-xs text-red-400">Zona de Perigo</h2>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-muted normal-case">
                  Permanently delete your account, your planet, and all associated data.
                </p>
              </div>
              <DeleteAccountButton />
            </div>
          </div>
        )}

        {/* Creator credit */}
        <div className="mt-6 border-t border-border/50 pt-4 text-center">
          <p className="text-[9px] text-muted normal-case">
            built by{" "}
            <a
              href="https://x.com/leonardomaia253"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
              style={{ color: accent }}
            >
              @leonardomaia253
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
