import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const invalidOrigin = requireSameOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(origin, { status: 302 });
}
