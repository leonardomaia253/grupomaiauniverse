import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Allow up to 60s on Vercel (Pro plan). Hobby plan max is 10s.
export const maxDuration = 60;

// ─── Route Handler ───────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const sb = getSupabaseAdmin();

  const { data: cached } = await sb
    .from("companies")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!cached) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ...cached, exists: true }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
