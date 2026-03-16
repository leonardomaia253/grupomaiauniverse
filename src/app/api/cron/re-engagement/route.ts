import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendNotificationAsync } from "@/lib/notifications";
import { buildButton } from "@/lib/email-template";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://maiauniverse.com.br";

interface ReEngagementTier {
  daysInactive: number;
  tier: string;
  subject: (login: string) => string;
  body: (login: string) => string;
  html: (login: string, extraInfo: string) => string;
}

const TIERS: ReEngagementTier[] = [
  {
    daysInactive: 7,
    tier: "7d",
    subject: () => "Your planet misses you!",
    body: (login) => `Hey @${login}, your planet in Maia Universe is waiting. Come check in!`,
    html: (login, extraInfo) => `
      <p style="color: #f0f0f0; font-size: 16px;">Your planet misses you, @${login}!</p>
      <p style="color: #f0f0f0;">It's been a week since your last visit. Your planet is still standing, but it could use some attention.</p>
      ${extraInfo}
      ${buildButton("Come Back", `${BASE_URL}/?user=${login}`)}
    `,
  },
  {
    daysInactive: 14,
    tier: "14d",
    subject: () => "New companies joined while you were away",
    body: (login) => `Hey @${login}, the Universe has grown since your last visit!`,
    html: (login, extraInfo) => `
      <p style="color: #f0f0f0; font-size: 16px;">The Universe grew while you were away!</p>
      <p style="color: #f0f0f0;">New companies have joined Maia Universe since your last visit, @${login}.</p>
      ${extraInfo}
      ${buildButton("See What's New", `${BASE_URL}/?user=${login}`)}
    `,
  },
  {
    daysInactive: 30,
    tier: "30d",
    subject: (login) => `Last check-in for @${login}`,
    body: (login) => `It's been a month, @${login}. This is our last reminder.`,
    html: (login, extraInfo) => `
      <p style="color: #f0f0f0; font-size: 16px;">It's been a while, @${login}</p>
      <p style="color: #f0f0f0;">It's been over a month since your last visit. Your planet is still in the Universe, waiting for you.</p>
      <p style="color: #666; font-size: 13px;">This is our last reminder. We won't bother you again unless you come back.</p>
      ${extraInfo}
      ${buildButton("Visit Maia Universe", `${BASE_URL}/?user=${login}`)}
    `,
  },
];

/**
 * Cron: Daily 14:00 UTC - Re-engagement emails for inactive companies.
 * Category: marketing (opt-in only, defaults to false).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  const now = new Date();
  // Year-week for dedup (each tier once per week max)
  const yearWeek = `${now.getFullYear()}-W${String(Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)).padStart(2, "0")}`;
  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const tier of TIERS) {
    const inactiveAfter = new Date(now.getTime() - tier.daysInactive * 86_400_000).toISOString();
    const inactiveBefore = new Date(now.getTime() - (tier.daysInactive - 1) * 86_400_000).toISOString();

    let offset = 0;
    const batchSize = 50;

    while (true) {
      // Find companies who were last active in the target window for this tier
      const { data: companies } = await sb
        .from("companies")
        .select("id, username")
        .eq("claimed", true)
        .not("email", "is", null)
        .lte("last_active_at", inactiveBefore)
        .gte("last_active_at", inactiveAfter)
        .range(offset, offset + batchSize - 1);

      if (!companies || companies.length === 0) break;

      // Check marketing opt-in
      const devIds = companies.map((d) => d.id);
      const { data: prefs } = await sb
        .from("notification_preferences")
        .select("company_id, marketing")
        .in("company_id", devIds);

      const marketingMap = new Map(
        (prefs ?? []).map((p) => [p.company_id, p.marketing]),
      );

      // Get extra info (kudos/raids received while away)
      const { data: recentKudos } = await sb
        .from("company_kudos")
        .select("receiver_id")
        .in("receiver_id", devIds)
        .gte("given_date", inactiveAfter.split("T")[0]);

      const kudosCounts = new Map<number, number>();
      for (const k of recentKudos ?? []) {
        kudosCounts.set(k.receiver_id, (kudosCounts.get(k.receiver_id) ?? 0) + 1);
      }

      for (const dev of companies) {
        // Marketing defaults to false, must be explicitly opted in
        if (!marketingMap.get(dev.id)) {
          results.skipped++;
          continue;
        }

        const kudos = kudosCounts.get(dev.id) ?? 0;
        const extraInfo = kudos > 0
          ? `<p style="color: #c8e64a; font-size: 14px;">You received ${kudos} kudos while you were away!</p>`
          : "";

        sendNotificationAsync({
          type: "re_engagement",
          category: "marketing",
          companyId: dev.id,
          dedupKey: `re_engage:${dev.id}:${tier.tier}:${yearWeek}`,
          title: tier.subject(dev.username),
          body: tier.body(dev.username),
          html: tier.html(dev.username, extraInfo),
          actionUrl: `${BASE_URL}/?user=${dev.username}`,
          priority: "low",
          channels: ["email"],
        });
        results.sent++;
      }

      if (companies.length < batchSize) break;
      offset += batchSize;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
