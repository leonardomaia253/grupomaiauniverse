import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { requireSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function getAuthenticatedDevId(): Promise<{ devId: number } | { error: string; status: number }> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 };

  const companyLogin = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  if (!companyLogin) return { error: "No GitHub login found", status: 400 };

  const sb = getSupabaseAdmin();
  const { data: dev } = await sb
    .from("companies")
    .select("id")
    .eq("username", companyLogin)
    .single();

  if (!dev) return { error: "company not found", status: 404 };
  return { devId: dev.id };
}

export async function GET() {
  const auth = await getAuthenticatedDevId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sb = getSupabaseAdmin();
  const { data: dev } = await sb
    .from("companies")
    .select("vscode_api_key_hash")
    .eq("id", auth.devId)
    .single();

  return NextResponse.json({ configured: Boolean(dev?.vscode_api_key_hash) });
}

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;

  const auth = await getAuthenticatedDevId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sb = getSupabaseAdmin();

  // API keys are shown only once. Calling POST rotates any existing key.
  const newKey = crypto.randomBytes(32).toString("base64url");

  const { error } = await sb
    .from("companies")
    .update({
      vscode_api_key_hash: hashKey(newKey),
    })
    .eq("id", auth.devId);

  if (error) {
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }

  return NextResponse.json({ key: newKey });
}

