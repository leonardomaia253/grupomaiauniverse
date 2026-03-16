import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Client-side Supabase client (anon key, respects RLS) — singleton for "use client" */
export function createBrowserSupabase() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}

/** Server-side Supabase client (service role, bypasses RLS). Now proxied via Edge Function. */
export function getSupabaseAdmin(): SupabaseClient {
  const adminSecret = process.env.ADMIN_PROXY_SECRET || "fallback-secret";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key to bypass local checks, proxy overrides it
    {
      auth: { persistSession: false },
      global: {
        fetch: async (url, options) => {
          const proxyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-proxy`;
          const newHeaders = new Headers(options?.headers);
          newHeaders.set("x-admin-proxy-secret", adminSecret);
          newHeaders.set("x-target-url", url.toString());

          return fetch(proxyUrl, {
            ...options,
            headers: newHeaders,
          });
        },
      },
    }
  );
}

/**
 * Broadcast a message to all Supabase Realtime subscribers on a channel.
 * Uses the HTTP REST endpoint (no WebSocket needed, works in serverless).
 *
 * The supabase-js client prepends "realtime:" to channel names internally,
 * so we must match that prefix here for the message to reach browser clients.
 */
export async function broadcastToChannel(
  topic: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`;
  const proxyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-proxy`;
  const adminSecret = process.env.ADMIN_PROXY_SECRET || "fallback-secret";

  try {
    await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "x-admin-proxy-secret": adminSecret,
        "x-target-url": url,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ topic, event, payload }],
      }),
    });
  } catch {
    // Fire and forget — broadcast failure should never block the API response
  }
}
