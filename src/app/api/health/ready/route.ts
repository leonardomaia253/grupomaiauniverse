import { createClient } from "@supabase/supabase-js";
import { getEnvironmentIssues } from "@/lib/env-validation";
import { timingSafeEqualString } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIMEOUT_MS = 4_000;

export async function GET(request: Request) {
  const expectedToken = process.env.HEALTHCHECK_TOKEN;
  const actualToken = request.headers.get("authorization") ?? "";
  if (!expectedToken || !timingSafeEqualString(actualToken, `Bearer ${expectedToken}`)) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }

  const environmentIssues = getEnvironmentIssues();
  if (environmentIssues.length > 0) {
    return Response.json(
      {
        status: "not_ready",
        checks: { environment: "failed", database: "not_checked" },
        missingOrInvalid: environmentIssues.map(({ name }) => name),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const query = supabase.from("companies").select("id", { head: true, count: "exact" }).limit(1);
    const result = await Promise.race([
      query,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("database timeout")), TIMEOUT_MS),
      ),
    ]);
    if (result.error) throw result.error;

    return Response.json(
      { status: "ready", checks: { environment: "ok", database: "ok" } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "not_ready", checks: { environment: "ok", database: "failed" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
