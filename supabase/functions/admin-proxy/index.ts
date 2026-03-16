import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req: Request) => {
  // We use a custom secret to authenticate the Next.js backend calling this proxy.
  // In production, you would generate a secure random string for this.
  const proxySecret = req.headers.get("x-admin-proxy-secret");
  const expectedSecret = Deno.env.get("ADMIN_PROXY_SECRET");

  if (!proxySecret || !expectedSecret || proxySecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized Gateway Access" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const targetUrlStr = req.headers.get("x-target-url");
  if (!targetUrlStr) {
    return new Response(JSON.stringify({ error: "Missing target URL" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
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

    const response = await fetch(targetUrlStr, {
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
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Proxy Error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
