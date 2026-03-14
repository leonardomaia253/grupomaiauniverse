import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

const MAX_THEME = 3;

/**
 * GET /api/preferences/theme
 * Returns the authenticated user's saved Universe theme index.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  const githubLogin = (
    user.user_metadata?.user_name ??
    user.user_metadata?.preferred_username ??
    ""
  ).toLowerCase();

  const { data: dev } = await sb
    .from("companies")
    .select("Universe_theme")
    .eq("github_login", githubLogin)
    .single();

  if (!dev) {
    return NextResponse.json({ Universe_theme: 0 });
  }

  return NextResponse.json({ Universe_theme: dev.Universe_theme ?? 0 });
}

/**
 * PATCH /api/preferences/theme
 * Update the authenticated user's Universe theme.
 * Body: { Universe_theme: number }
 */
export async function PATCH(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const theme = body.Universe_theme;

  if (typeof theme !== "number" || theme < 0 || theme > MAX_THEME || !Number.isInteger(theme)) {
    return NextResponse.json({ error: "Invalid theme index" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const githubLogin = (
    user.user_metadata?.user_name ??
    user.user_metadata?.preferred_username ??
    ""
  ).toLowerCase();

  const { error } = await sb
    .from("companies")
    .update({ Universe_theme: theme })
    .eq("github_login", githubLogin);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ Universe_theme: theme });
}
