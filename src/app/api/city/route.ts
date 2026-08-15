import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const EMPTY = {
  companies: [],
  stats: { total_companies: 0, total_contributions: 0 },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (process.env.NODE_ENV === "development" && searchParams.get("live") !== "1") {
      return NextResponse.json(EMPTY, { headers: { "Cache-Control": "no-store" } });
    }

    const from = Math.max(0, Number.parseInt(searchParams.get("from") ?? "0", 10));
    const requestedTo = Number.parseInt(searchParams.get("to") ?? "500", 10);
    const to = Math.min(from + 1000, Number.isFinite(requestedTo) ? requestedTo : 500);
    const sb = getSupabaseAdmin();

    const [companiesResult, statsResult] = await Promise.all([
      sb
        .from("companies")
        .select("id, username, name, avatar_url, contributions, total_stars, public_repos, category, employee_count, applications_count, rank, claimed, contributions_total, contribution_years, total_prs, total_reviews, repos_contributed_to, followers, following, organizations_count, account_created_at, current_streak, active_days_last_year, language_diversity, yield_percent")
        .order("rank", { ascending: true })
        .range(from, to - 1),
      sb.from("Universe_stats").select("total_companies, total_contributions").eq("id", 1).single(),
    ]);

    if (companiesResult.error) throw companiesResult.error;

    return NextResponse.json(
      {
        companies: companiesResult.data ?? [],
        stats: statsResult.data ?? EMPTY.stats,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.warn("[portfolio] Using an empty public payload", error);
    return NextResponse.json(EMPTY, { headers: { "Cache-Control": "no-store" } });
  }
}

