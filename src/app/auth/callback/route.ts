import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { cacheEmailFromAuth, touchLastActive, ensurePreferences } from "@/lib/notification-helpers";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/?error=no_code`);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/?error=auth_failed`);

  const username = (
    data.user.user_metadata.user_name ??
    data.user.user_metadata.preferred_username ??
    data.user.user_metadata.full_name ??
    data.user.email?.split("@")[0] ??
    ""
  ).toLowerCase();

  if (!username) return NextResponse.redirect(origin);

  const admin = getSupabaseAdmin();
  const provider = data.user.identities?.[0]?.provider ?? "email";
  const { data: existing } = await admin.from("companies").select("id, claimed").eq("username", username).maybeSingle();
  let companyId = existing?.id;

  if (existing && !existing.claimed) {
    await admin.from("companies").update({
      claimed: true,
      claimed_by: data.user.id,
      claimed_at: new Date().toISOString(),
      fetch_priority: 1,
      provider,
    }).eq("id", existing.id).eq("claimed", false);
  } else if (!existing && isAdmin(data.user.email)) {
    const { data: created } = await admin.from("companies").upsert({
      username,
      avatar_url: data.user.user_metadata.avatar_url,
      name: data.user.user_metadata.full_name,
      provider,
      fetched_at: new Date().toISOString(),
      claimed: true,
      claimed_by: data.user.id,
      claimed_at: new Date().toISOString(),
      fetch_priority: 1,
    }, { onConflict: "username" }).select("id").single();
    companyId = created?.id;
  }

  if (companyId) {
    await Promise.all([
      cacheEmailFromAuth(companyId, data.user.id),
      ensurePreferences(companyId),
    ]);
    touchLastActive(companyId);
  }

  const next = searchParams.get("next");
  if (next === "/shop") return NextResponse.redirect(`${origin}/shop/${username}`);
  return NextResponse.redirect(`${origin}/?user=${username}`);
}

