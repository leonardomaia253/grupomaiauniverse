import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import LeaderboardTracker from "@/components/LeaderboardTracker";
import LeaderboardYouBadge, { LeaderboardAuthProvider } from "@/components/LeaderboardYouBadge";
import LeaderboardUserPosition from "@/components/LeaderboardUserPosition";
import LeaderboardYouVsNext from "@/components/LeaderboardYouVsNext";
import FlyLeaderboard from "@/components/FlyLeaderboard";
import DailiesLeaderboard from "@/components/DailiesLeaderboard";
import { rankFromLevel, tierFromLevel } from "@/lib/xp";

export const revalidate = 300; // ISR: regenerate every 5 min

export const metadata: Metadata = {
  title: "Leaderboard - Git Universe",
  description:
    "Top GitHub companies ranked by contributions, stars, repos, achievements, and referrals in Git Universe.",
};

interface company {
  username: string;
  name: string | null;
  avatar_url: string | null;
  contributions: number;
  contributions_total: number | null;
  total_stars: number;
  public_repos: number;
  primary_language: string | null;
  rank: number | null;
  referral_count: number;
  kudos_count: number;
  created_at?: string;
  xp_total?: number;
  xp_level?: number;
}

type TabId = "contributors" | "stars" | "architects" | "achievers" | "recruiters" | "xp";

const TABS: { id: TabId; label: string; metric: string }[] = [
  { id: "contributors", label: "Contributors", metric: "contributions" },
  { id: "stars", label: "Stars", metric: "total_stars" },
  { id: "architects", label: "Architects", metric: "public_repos" },
  { id: "achievers", label: "Achievers", metric: "achievements" },
  { id: "recruiters", label: "Recruiters", metric: "referral_count" },
  { id: "xp", label: "XP", metric: "xp_total" },
];

const ACCENT = "#c8e64a";

function rankColor(rank: number): string {
  if (rank === 1) return "#ffd700";
  if (rank === 2) return "#c0c0c0";
  if (rank === 3) return "#cd7f32";
  return ACCENT;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode ?? "companies";
  const activeTab = (params.tab ?? "contributors") as TabId;

  const supabase = getSupabaseAdmin();

  // Fetch companies sorted by the active metric
  // Contributors uses rank (based on contributions_total) for consistency
  const orderColumn = activeTab === "contributors" ? "rank"
    : activeTab === "stars" ? "total_stars"
    : activeTab === "architects" ? "public_repos"
    : activeTab === "recruiters" ? "referral_count"
    : activeTab === "xp" ? "xp_total"
    : "contributions"; // achievers handled separately
  const orderAscending = activeTab === "contributors"; // rank is ascending (1 = best)

  let companies: company[] = [];
  let achieverCounts: Record<string, number> = {};

  if (activeTab === "achievers") {
    // DB-side aggregation: get top 50 companies by achievement count
    const { data: topAchievers } = await supabase
      .rpc("top_achievers", { lim: 50 });

    const achieverIds = (topAchievers ?? []).map((a: { company_id: number }) => a.company_id);
    const achCountMap: Record<number, number> = {};
    for (const a of topAchievers ?? []) {
      achCountMap[a.company_id] = a.ach_count;
    }

    // Fetch dev details only for the top achievers
    const { data: achievercompanies } = achieverIds.length > 0
      ? await supabase
        .from("companies")
        .select("id, username, name, avatar_url, contributions, contributions_total, total_stars, public_repos, primary_language, rank, referral_count, kudos_count, created_at, xp_total, xp_level")
        .in("id", achieverIds)
      : { data: [] };

    // Sort by achievement count (preserving DB order)
    const sorted = (achievercompanies ?? [])
      .map((d) => ({ ...d, ach_count: achCountMap[d.id] ?? 0 }))
      .sort((a, b) => b.ach_count - a.ach_count || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    companies = sorted as unknown as company[];
    for (const d of sorted) {
      achieverCounts[d.username] = d.ach_count;
    }
  } else {
    const { data } = await supabase
      .from("companies")
      .select("username, name, avatar_url, contributions, contributions_total, total_stars, public_repos, primary_language, rank, referral_count, kudos_count, created_at, xp_total, xp_level")
      .order(orderColumn, { ascending: orderAscending, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(50);
    companies = (data ?? []) as company[];
  }

  // Check if recruiters tab should be hidden (no referral data)
  const hasRecruiters = activeTab === "recruiters"
    ? companies.some((d) => (d.referral_count ?? 0) > 0)
    : true;

  const topLogins = companies.map((d) => d.username.toLowerCase());

  function getMetricValue(dev: company): string {
    switch (activeTab) {
      case "contributors": return ((dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions).toLocaleString();
      case "stars": return dev.total_stars.toLocaleString();
      case "architects": return dev.public_repos.toLocaleString();
      case "achievers": return String(achieverCounts[dev.username] ?? 0);
      case "recruiters": return (dev.referral_count ?? 0).toLocaleString();
      case "xp": return (dev.xp_total ?? 0).toLocaleString();
      default: return "";
    }
  }

  function getXpBadge(dev: company): { title: string; color: string } | null {
    if (activeTab !== "xp" || !dev.xp_level) return null;
    const rank = rankFromLevel(dev.xp_level);
    const tier = tierFromLevel(dev.xp_level);
    return { title: `Lv${dev.xp_level} ${rank.title}`, color: tier.color };
  }

  const metricLabel = activeTab === "contributors" ? "Contributions"
    : activeTab === "stars" ? "Stars"
    : activeTab === "architects" ? "Repos"
    : activeTab === "achievers" ? "Achievements"
    : activeTab === "xp" ? "XP"
    : "Referrals";

  // A4: Raw metric values for "You vs. Next" component
  function getMetricValueRaw(dev: company): number {
    switch (activeTab) {
      case "contributors": return (dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions;
      case "stars": return dev.total_stars;
      case "architects": return dev.public_repos;
      case "achievers": return achieverCounts[dev.username] ?? 0;
      case "recruiters": return dev.referral_count ?? 0;
      case "xp": return dev.xp_total ?? 0;
      default: return 0;
    }
  }

  const devMetrics = companies.map((d) => ({
    login: d.username.toLowerCase(),
    value: getMetricValueRaw(d),
  }));

  // A6: "NEW" detection — companies created in last 7 days
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const newLogins = new Set(
    companies
      .filter((d) => d.created_at && new Date(d.created_at).getTime() > sevenDaysAgo)
      .map((d) => d.username.toLowerCase())
  );

  return (
    <LeaderboardAuthProvider>
    <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
      <LeaderboardTracker tab={activeTab} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-muted transition-colors hover:text-cream"
          >
            &larr; Back to Universe
          </Link>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-3xl text-cream md:text-4xl">
            Leader<span style={{ color: ACCENT }}>board</span>
          </h1>
          <p className="mt-3 text-xs text-muted normal-case">
            Top companies ranked in Git Universe
          </p>
        </div>

        {/* Mode toggle: companies | Game */}
        <div className="mt-6 flex justify-center">
          <div className="flex border-2 border-border">
            <Link
              href="/leaderboard?mode=companies"
              className="px-5 py-2 text-[11px] transition-colors"
              style={{
                color: mode === "companies" ? ACCENT : "var(--color-muted)",
                backgroundColor: mode === "companies" ? "rgba(200, 230, 74, 0.1)" : "transparent",
              }}
            >
              companies
            </Link>
            <Link
              href="/leaderboard?mode=game"
              className="relative border-l-2 border-border px-5 py-2 text-[11px] transition-colors"
              style={{
                color: mode === "game" ? ACCENT : "var(--color-muted)",
                backgroundColor: mode === "game" ? "rgba(200, 230, 74, 0.1)" : "transparent",
              }}
            >
              Game
            </Link>
            <Link
              href="/leaderboard?mode=dailies"
              className="relative border-l-2 border-border px-5 py-2 text-[11px] transition-colors"
              style={{
                color: mode === "dailies" ? ACCENT : "var(--color-muted)",
                backgroundColor: mode === "dailies" ? "rgba(200, 230, 74, 0.1)" : "transparent",
              }}
            >
              Dailies
            </Link>
          </div>
        </div>

        {mode === "dailies" ? (
          <Suspense
            fallback={
              <div className="mt-10 text-center text-xs text-muted normal-case">
                Loading dailies leaderboard...
              </div>
            }
          >
            <DailiesLeaderboard />
          </Suspense>
        ) : mode === "companies" ? (
          <>
            {/* Tabs */}
            <div className="mt-6 flex flex-wrap justify-center gap-1">
              {TABS.filter((t) => t.id !== "recruiters" || hasRecruiters).map((tab) => (
                <Link
                  key={tab.id}
                  href={`/leaderboard?tab=${tab.id}`}
                  className="px-3 py-1.5 text-[10px] transition-colors border-2"
                  style={{
                    borderColor: activeTab === tab.id ? ACCENT : "var(--color-border)",
                    color: activeTab === tab.id ? ACCENT : "var(--color-muted)",
                    backgroundColor: activeTab === tab.id ? "rgba(200, 230, 74, 0.1)" : "transparent",
                  }}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* A4: "You vs. Next" banner */}
            <LeaderboardYouVsNext metrics={devMetrics} metricLabel={metricLabel} />

            {/* Table */}
            <div className="mt-6 border-[3px] border-border">
              {/* Header row */}
              <div className="flex items-center gap-4 border-b-[3px] border-border bg-bg-card px-5 py-3 text-xs text-muted">
                <span className="w-10 text-center">#</span>
                <span className="flex-1">company</span>
                <span className="hidden w-24 text-right sm:block">{activeTab === "xp" ? "Rank" : "Language"}</span>
                <span className="w-28 text-right">{metricLabel}</span>
              </div>

              {/* Rows */}
              {companies.map((dev, i) => {
                const pos = i + 1;
                return (
                  <Link
                    key={dev.username}
                    href={`/dev/${dev.username}`}
                    className="flex items-center gap-4 border-b border-border/50 px-5 py-3.5 transition-colors hover:bg-bg-card"
                  >
                    <span className="w-10 text-center">
                      <span
                        className="text-sm font-bold"
                        style={{ color: rankColor(pos) }}
                      >
                        {pos}
                      </span>
                      {newLogins.has(dev.username.toLowerCase()) && (
                        <span className="block text-[7px] font-bold" style={{ color: "#ffd700" }}>
                          NEW
                        </span>
                      )}
                    </span>

                    <div className="flex flex-1 items-center gap-3 overflow-hidden">
                      {dev.avatar_url && (
                        <Image
                          src={dev.avatar_url}
                          alt={dev.username}
                          width={36}
                          height={36}
                          className="border-2 border-border"
                          style={{ imageRendering: "pixelated" }}
                        />
                      )}
                      <div className="overflow-hidden">
                        <p className="truncate text-sm text-cream">
                          {dev.name ?? dev.username}
                          <LeaderboardYouBadge login={dev.username} />
                        </p>
                        {dev.name && (
                          <p className="truncate text-[10px] text-muted">
                            @{dev.username}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="hidden w-24 text-right text-xs text-muted sm:block">
                      {activeTab === "xp"
                        ? (() => {
                            const badge = getXpBadge(dev);
                            return badge ? (
                              <span style={{ color: badge.color }}>{badge.title}</span>
                            ) : "\u2014";
                          })()
                        : (dev.primary_language ?? "\u2014")}
                    </span>

                    <span className="w-28 text-right text-sm" style={{ color: activeTab === "xp" ? tierFromLevel(dev.xp_level ?? 1).color : ACCENT }}>
                      {getMetricValue(dev)}
                    </span>
                  </Link>
                );
              })}

              {/* "YOU" row if not in top 50 — handled client-side */}
              <LeaderboardUserPosition tab={activeTab} topLogins={topLogins} />

              {companies.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-muted normal-case">
                  No data for this category yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <Suspense
            fallback={
              <div className="mt-10 text-center text-xs text-muted normal-case">
                Loading daily scores...
              </div>
            }
          >
            <FlyLeaderboard />
          </Suspense>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="btn-press inline-block px-7 py-3.5 text-sm text-bg"
            style={{
              backgroundColor: ACCENT,
              boxShadow: "4px 4px 0 0 #5a7a00",
            }}
          >
            Enter the Universe
          </Link>

          <p className="mt-6 text-[9px] text-muted normal-case">
            built by{" "}
            <a
              href="https://x.com/samuelrizzondev"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
              style={{ color: ACCENT }}
            >
              @samuelrizzondev
            </a>
          </p>
        </div>
      </div>
    </main>
    </LeaderboardAuthProvider>
  );
}
