import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST: client heartbeat — upsert + prune + count via Postgres RPC
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ count: 1 }, { headers: { "Cache-Control": "no-store" } });
    }
    const body = await request.json().catch(() => null);
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
    if (!sessionId || sessionId.length > 64) {
      return NextResponse.json({ error: "invalid sessionId" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data: count, error } = await sb.rpc("heartbeat_visitor", {
      p_session_id: sessionId,
    });

    if (error) throw error;

    return NextResponse.json({ count: count ?? 1 });
  } catch (error) {
    console.warn("[online] Falling back to single visitor", error);
    return NextResponse.json({ count: 1 }, { headers: { "Cache-Control": "no-store" } });
  }
}

// GET: just return current count
export async function GET() {
  try {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ count: 0 }, { headers: { "Cache-Control": "no-store" } });
    }
    const sb = getSupabaseAdmin();
    const { count, error } = await sb
      .from("site_visitors")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json(
      { count: count ?? 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.warn("[online] Falling back to zero visitors", error);
    return NextResponse.json({ count: 0 }, { headers: { "Cache-Control": "no-store" } });
  }
}
