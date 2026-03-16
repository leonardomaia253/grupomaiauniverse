import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import { getcompanyEmail } from "@/lib/notification-helpers";
import { buildUnsubscribeUrl } from "@/lib/notifications";

const FROM = "Git Universe <noreply@thegitUniverse.com>";

/**
 * POST /api/admin/send-update-email
 * Send a product update email to all claimed companies with email.
 * Sends the provided HTML as-is (no wrapInBaseTemplate) so custom
 * email designs are preserved exactly as authored.
 * Protected by CRON_SECRET.
 *
 * Body: { subject: string, html: string, slug: string }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { subject?: string; html?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subject, html, slug } = body;
  if (!subject || !html || !slug) {
    return NextResponse.json(
      { error: "Missing required fields: subject, html, slug" },
      { status: 400 },
    );
  }

  const sb = getSupabaseAdmin();
  const resend = getResend();
  const results = { sent: 0, skipped: 0, failed: 0 };

  let offset = 0;
  const batchSize = 50;

  while (true) {
    const { data: companies } = await sb
      .from("companies")
      .select("id, username")
      .eq("claimed", true)
      .not("email", "is", null)
      .range(offset, offset + batchSize - 1);

    if (!companies || companies.length === 0) break;

    // Check email_enabled preference (skip if explicitly disabled)
    const devIds = companies.map((d) => d.id);
    const { data: prefs } = await sb
      .from("notification_preferences")
      .select("company_id, email_enabled")
      .in("company_id", devIds);

    const emailDisabled = new Set(
      (prefs ?? []).filter((p) => p.email_enabled === false).map((p) => p.company_id),
    );

    for (const dev of companies) {
      if (emailDisabled.has(dev.id)) {
        results.skipped++;
        continue;
      }

      const email = await getcompanyEmail(dev.id);
      if (!email) {
        results.skipped++;
        continue;
      }

      const unsubUrl = buildUnsubscribeUrl(dev.id, "marketing");

      // Inject unsubscribe link before closing </body>
      const finalHtml = html.replace(
        "</body>",
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0e;"><tr><td align="center" style="padding: 0 20px 48px;"><span style="font-family: 'Silkscreen', monospace; font-size: 11px; color: #3a3a44;"><a href="${unsubUrl}" style="color: #3a3a44; text-decoration: underline; font-family: 'Silkscreen', monospace; font-size: 11px;">unsubscribe</a></span></td></tr></table></body>`,
      );

      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject,
        html: finalHtml,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (error) {
        results.failed++;
      } else {
        results.sent++;
      }
    }

    if (companies.length < batchSize) break;
    offset += batchSize;
  }

  return NextResponse.json({ ok: true, ...results });
}
