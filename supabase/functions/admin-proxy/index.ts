import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAllowedSupabaseTarget(targetUrl: URL, supabaseUrl: URL): boolean {
  if (targetUrl.origin !== supabaseUrl.origin) return false;

  return [
    "/rest/v1/",
    "/auth/v1/",
    "/storage/v1/",
    "/realtime/v1/",
  ].some((prefix) => targetUrl.pathname.startsWith(prefix));
}

serve(async (req: Request) => {
  // We use a custom secret to authenticate the Next.js backend calling this proxy.
  const proxySecret = req.headers.get("x-admin-proxy-secret");
  const expectedSecret = Deno.env.get("ADMIN_PROXY_SECRET");

  if (!proxySecret || !expectedSecret || proxySecret !== expectedSecret) {
    return json({ error: "Unauthorized Gateway Access" }, 401);
  }

  const targetUrlStr = req.headers.get("x-target-url");
  if (!targetUrlStr) {
    return json({ error: "Missing target URL" }, 400);
  }

  try {
    const supabaseUrlStr = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrlStr) throw new Error("Missing SUPABASE_URL in Edge Function environment");

    const targetUrl = new URL(targetUrlStr);
    const supabaseUrl = new URL(supabaseUrlStr);

    if (!isAllowedSupabaseTarget(targetUrl, supabaseUrl)) {
      return json({ error: "Target URL is not allowed" }, 403);
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) throw new Error("Missing service key in Edge Function environment");

    // Reconstruct headers for the Supabase backend
    const newHeaders = new Headers(req.headers);
    newHeaders.delete("x-admin-proxy-secret");
    newHeaders.delete("x-target-url");
    newHeaders.delete("host"); 
    
    // Inject the real admin key securely on the Supabase side
    newHeaders.set("Authorization", `Bearer ${serviceKey}`);
    newHeaders.set("apikey", serviceKey);

    // Forward the request body if present
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: newHeaders,
      body
    });

    const responseBody = await response.arrayBuffer();
    
    // Pass back exactly what Supabase responded with
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: "Proxy Error", details: message }, 500);
  }
});
