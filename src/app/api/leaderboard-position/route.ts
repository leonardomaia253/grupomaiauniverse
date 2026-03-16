import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "contributors";
  const login = searchParams.get("login")?.toLowerCase();

  if (!login) {
    return NextResponse.json({ error: "Missing login" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  const { data: dev } = await sb
    .from("companies")
    .select("id, username, name, avatar_url, contributions, contributions_total, total_stars, public_repos, rank, referral_count, kudos_count")
    .eq("username", login)
    .single();

  if (!dev) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let position: number | null = null;
  let metricValue = "";

  if (tab === "contributors") {
    position = dev.rank;
    const contribs = (dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions;
    metricValue = contribs.toLocaleString();
  } else if (tab === "stars") {
    const { count } = await sb
      .from("companies")
      .select("id", { count: "exact", head: true })
      .gt("total_stars", dev.total_stars);
    position = (count ?? 0) + 1;
    metricValue = dev.total_stars.toLocaleString();
  } else if (tab === "architects") {
    const { count } = await sb
      .from("companies")
      .select("id", { count: "exact", head: true })
      .gt("public_repos", dev.public_repos);
    position = (count ?? 0) + 1;
    metricValue = dev.public_repos.toLocaleString();
  } else if (tab === "recruiters") {
    const { count } = await sb
      .from("companies")
      .select("id", { count: "exact", head: true })
      .gt("referral_count", dev.referral_count ?? 0);
    position = (count ?? 0) + 1;
    metricValue = (dev.referral_count ?? 0).toLocaleString();
  } else if (tab === "achievers") {
    const { count: userAchCount } = await sb
      .from("company_achievements")
      .select("id", { count: "exact", head: true })
      .eq("company_id", dev.id);
    const achCount = userAchCount ?? 0;
    // Count how many companies have more achievements using DB-side aggregation
    const { count: companiesAbove } = await sb.rpc("count_companies_with_more_achievements", {
      target_count: achCount,
    });
    position = (companiesAbove ?? 0) + 1;
    metricValue = String(achCount);
  }

  return NextResponse.json(
    {
      username: dev.username,
      name: dev.name,
      avatar_url: dev.avatar_url,
      position,
      metricValue,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
