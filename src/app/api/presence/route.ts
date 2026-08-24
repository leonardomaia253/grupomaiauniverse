import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { count: 0, companies: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const sb = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();

    const { data: sessions, error } = await sb
      .from("company_sessions")
      .select(
        `
        company_id,
        session_id,
        status,
        current_language,
        last_heartbeat_at,
        companies(username, avatar_url)
      `,
      )
      .in("status", ["active", "idle"])
      .gte("last_heartbeat_at", cutoff);

    if (error) throw error;

    // Deduplicate by company (keep latest session)
    const byDev = new Map<number, (typeof sessions)[number]>();
    for (const s of sessions ?? []) {
      const existing = byDev.get(s.company_id);
      if (
        !existing ||
        (s.last_heartbeat_at &&
          existing.last_heartbeat_at &&
          s.last_heartbeat_at > existing.last_heartbeat_at)
      ) {
        byDev.set(s.company_id, s);
      }
    }

    const companies = Array.from(byDev.values()).map((s) => {
      const dev = s.companies as any;
      return {
        companyLogin: dev?.username,
        avatarUrl: dev?.avatar_url,
        status: s.status,
        language: s.current_language,
        // project and companyId intentionally excluded for privacy/security
      };
    });

    return NextResponse.json(
      { count: companies.length, companies },
      {
        headers: {
          "Cache-Control": "s-maxage=10, stale-while-revalidate=20",
        },
      },
    );
  } catch (error) {
    console.warn("[presence] Falling back to empty presence", error);
    return NextResponse.json(
      { count: 0, companies: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
