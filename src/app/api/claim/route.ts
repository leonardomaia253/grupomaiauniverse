import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  }

  const companyLogin = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  if (!companyLogin) {
    return NextResponse.json(
      { error: "O perfil não possui um identificador compatível" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Cada identidade pode verificar apenas um perfil de empresa.
  const { data: alreadyClaimed } = await admin
    .from("companies")
    .select("username")
    .eq("claimed_by", user.id)
    .maybeSingle();

  if (alreadyClaimed) {
    return NextResponse.json(
      { error: "Esta identidade já está associada a outra empresa" },
      { status: 409 }
    );
  }

  // Atomic claim: eq("claimed", false) + is("claimed_by", null) prevents race conditions
  const { data, error } = await admin
    .from("companies")
    .update({
      claimed: true,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      fetch_priority: 1,
    })
    .eq("username", companyLogin)
    .eq("claimed", false)
    .is("claimed_by", null)
    .select("username")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Empresa não encontrada ou perfil já verificado" },
      { status: 404 }
    );
  }

  // Insert feed event
  const { data: dev } = await admin
    .from("companies")
    .select("id")
    .eq("username", companyLogin)
    .single();

  if (dev) {
    await admin.from("activity_feed").insert({
      event_type: "company_verified",
      actor_id: dev.id,
      metadata: { login: companyLogin },
    });
  }

  return NextResponse.json({ claimed: true, username: data.username });
}

