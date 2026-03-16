import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_EVENTS = new Set(["impression", "click", "cta_click"]);
const BOT_UA_PATTERNS = /bot|crawler|spider|headless|phantomjs|selenium|puppeteer|wget|curl|python-requests|scrapy|slurp|mediapartners/i;

const ALLOWED_ORIGINS = new Set([
  "https://thegitUniverse.com",
  "https://www.thegitUniverse.com",
  "http://localhost:3001",
  "http://localhost:3000",
]);

interface Entry {
  count: number;
  resetAt: number;
}
const store = new Map<string, Entry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function rateLimit(key: string, limit: number, windowMs: number) {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false };
  }
  entry.count++;
  return { ok: true };
}

async function hashIP(ip: string): Promise<string> {
  // Use edge function environment variable (which is implicitly the admin key in this logic context, 
  // or a secret configured by the user)
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const data = new TextEncoder().encode(ip + secret);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Origin validation ──
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (origin) {
    try {
      const url = new URL(origin);
      if (!ALLOWED_ORIGINS.has(url.origin)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }
  }

  // ── Bot filtering ──
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA_PATTERNS.test(ua)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { ok } = rateLimit(`ad:${ip}`, 120, 60_000);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: corsHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const { ad_id, github_login } = body;
  if (!ad_id || typeof ad_id !== "string") {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
  }

  const types: string[] = [];
  if (body.event_type && VALID_EVENTS.has(body.event_type)) {
    types.push(body.event_type);
  }
  if (Array.isArray(body.event_types)) {
    for (const t of body.event_types) {
      if (typeof t === "string" && VALID_EVENTS.has(t) && !types.includes(t)) {
        types.push(t);
      }
    }
  }

  if (types.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid event type" }), { status: 400, headers: corsHeaders });
  }

  const ipHash = await hashIP(ip);
  const userAgent = req.headers.get("user-agent")?.slice(0, 256) ?? null;
  const login = typeof github_login === "string" ? github_login.slice(0, 39).toLowerCase() : null;
  const country = req.headers.get("cf-ipcountry") ?? null;

  // Uses Service Role Key directly injected into Edge Function env
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const sb = createClient(supabaseUrl, supabaseServiceKey);

  // ── Click dedup: same ip_hash + ad_id within 1 hour = skip insert ──
  const clickTypes = types.filter((t) => t === "click" || t === "cta_click");
  const nonClickTypes = types.filter((t) => t !== "click" && t !== "cta_click");

  let dedupedClickTypes = clickTypes;
  if (clickTypes.length > 0) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await sb
      .from("sky_ad_events")
      .select("id", { count: "exact", head: true })
      .eq("ad_id", ad_id)
      .eq("ip_hash", ipHash)
      .in("event_type", clickTypes)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) > 0) {
      dedupedClickTypes = [];
    }
  }

  const finalTypes = [...nonClickTypes, ...dedupedClickTypes];

  if (finalTypes.length === 0) {
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: corsHeaders });
  }

  const rows = finalTypes.map((event_type) => ({
    ad_id,
    event_type,
    ip_hash: ipHash,
    user_agent: userAgent,
    github_login: login,
    country,
  }));

  await sb.from("sky_ad_events").insert(rows);

  return new Response(JSON.stringify({ ok: true }), { status: 201, headers: corsHeaders });
});
