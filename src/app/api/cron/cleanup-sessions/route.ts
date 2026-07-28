import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireCronRequest } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = requireCronRequest(request.headers.get("authorization"));
  if (unauthorized) return unauthorized;

  const sb = getSupabaseAdmin();
  const now = Date.now();
  const idleCutoff = new Date(now - 5 * 60_000).toISOString();
  const offlineCutoff = new Date(now - 15 * 60_000).toISOString();

  // Mark sessions offline if no heartbeat in 15 minutes
  const { data: offlinedRows } = await sb
    .from("company_sessions")
    .update({ status: "offline", ended_at: new Date().toISOString() })
    .in("status", ["active", "idle"])
    .lt("last_heartbeat_at", offlineCutoff)
    .select("id");

  // Mark sessions idle if no heartbeat in 5 minutes
  const { data: idledRows } = await sb
    .from("company_sessions")
    .update({ status: "idle" })
    .eq("status", "active")
    .lt("last_heartbeat_at", idleCutoff)
    .select("id");

  return NextResponse.json({
    ok: true,
    offlined: offlinedRows?.length ?? 0,
    idled: idledRows?.length ?? 0,
  });
}
