import type { SupabaseClient } from "@supabase/supabase-js";

export async function claimWebhookEvent(
  sb: SupabaseClient,
  provider: string,
  eventId: string,
  eventType?: string,
): Promise<boolean> {
  const { error } = await sb.from("webhook_events").insert({
    provider,
    event_id: eventId,
    event_type: eventType ?? null,
  });

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  throw error;
}
