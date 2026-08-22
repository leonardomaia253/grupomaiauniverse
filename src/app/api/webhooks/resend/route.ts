import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import { claimWebhookEvent } from "@/lib/webhook-events";

export const dynamic = "force-dynamic";

/**
 * Resend webhook handler for email delivery events.
 * Handles bounces, complaints, delivery confirmations, and opens/clicks.
 * Updates notification_log delivery lifecycle and notification_suppressions.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook:resend] RESEND_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }

  const webhookId = request.headers.get("svix-id");
  const webhookTimestamp = request.headers.get("svix-timestamp");
  const webhookSignature = request.headers.get("svix-signature");
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const payload = await request.text();
  if (payload.length > 1_000_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: { type: string; data: Record<string, unknown> };
  try {
    body = getResend().webhooks.verify({
      payload,
      webhookSecret,
      headers: {
        id: webhookId,
        timestamp: webhookTimestamp,
        signature: webhookSignature,
      },
    }) as unknown as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    if (!(await claimWebhookEvent(sb, "resend", webhookId, body.type))) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (body.type) {
      case "email.bounced": {
        const email = (body.data.to as string[])?.[0];
        const emailId = body.data.email_id as string;

        if (email) {
          // Add to suppressions
          await sb
            .from("notification_suppressions")
            .upsert(
              { identifier: email, channel: "email", reason: "bounce", created_at: now },
              { onConflict: "identifier,channel" },
            );
        }

        if (emailId) {
          await sb
            .from("notification_log")
            .update({ status: "bounced", failed_at: now, failure_reason: "bounced" })
            .eq("provider_id", emailId);
        }
        break;
      }

      case "email.complained": {
        const email = (body.data.to as string[])?.[0];
        const emailId = body.data.email_id as string;

        if (email) {
          await sb
            .from("notification_suppressions")
            .upsert(
              { identifier: email, channel: "email", reason: "complaint", created_at: now },
              { onConflict: "identifier,channel" },
            );
        }

        if (emailId) {
          await sb
            .from("notification_log")
            .update({ status: "complained", failed_at: now, failure_reason: "spam_complaint" })
            .eq("provider_id", emailId);
        }
        break;
      }

      case "email.delivered": {
        const emailId = body.data.email_id as string;
        if (emailId) {
          await sb
            .from("notification_log")
            .update({ status: "delivered", delivered_at: now })
            .eq("provider_id", emailId);
        }
        break;
      }

      case "email.opened": {
        const emailId = body.data.email_id as string;
        if (emailId) {
          await sb
            .from("notification_log")
            .update({ opened_at: now })
            .eq("provider_id", emailId)
            .is("opened_at", null); // Only update first open
        }
        break;
      }

      case "email.clicked": {
        const emailId = body.data.email_id as string;
        if (emailId) {
          await sb
            .from("notification_log")
            .update({ clicked_at: now })
            .eq("provider_id", emailId)
            .is("clicked_at", null); // Only update first click
        }
        break;
      }
    }
  } catch (err) {
    console.error("[webhook:resend] Error processing event:", err);
  }

  return NextResponse.json({ received: true });
}
