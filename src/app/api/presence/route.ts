import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const sb = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();

  const { data: sessions, error } = await sb
    .from("company_sessions")
    .select(`
      company_id,
      session_id,
      status,
      current_language,
      last_heartbeat_at,
      companies!inner(username, avatar_url)
    `)
    .in("status", ["active", "idle"])
    .gte("last_heartbeat_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by company (keep latest session)
  const byDev = new Map<number, (typeof sessions)[number]>();
  for (const s of sessions ?? []) {
    const existing = byDev.get(s.company_id);
    if (!existing || s.last_heartbeat_at > existing.last_heartbeat_at) {
      byDev.set(s.company_id, s);
    }
  }

  const companies = Array.from(byDev.values()).map((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dev = s.companies as any;
    return {
      githubLogin: dev.username,
      avatarUrl: dev.avatar_url,
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
}
