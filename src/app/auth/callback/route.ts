import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkAchievements } from "@/lib/achievements";
import { cacheEmailFromAuth, touchLastActive, ensurePreferences } from "@/lib/notification-helpers";
import { sendWelcomeNotification } from "@/lib/notification-senders/welcome";
import { sendReferralJoinedNotification } from "@/lib/notification-senders/referral";
import { fetchGitHubcompanyData } from "@/lib/github-api";
import { calculateGithubXp } from "@/lib/xp";

// Extend timeout for GitHub API calls during login
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  const githubLogin = (
    data.user.user_metadata.user_name ??
    data.user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  const admin = getSupabaseAdmin();

  if (githubLogin) {
    // Check if Company already exists in the database
    const { data: existingCompany } = await admin
      .from("companies")
      .select("id, claimed")
      .eq("github_login", githubLogin)
      .maybeSingle();

    if (!existingCompany) {
      // ─── New Company: create planet from GitHub data on login ───
      try {
        const ghData = await fetchGitHubcompanyData(githubLogin, { allowEmpty: true });

        const { data: created, error: createErr } = await admin
          .from("companies")
          .upsert({
            ...ghData,
            fetched_at: new Date().toISOString(),
            claimed: true,
            claimed_by: data.user.id,
            claimed_at: new Date().toISOString(),
            fetch_priority: 1,
          }, { onConflict: "github_login" })
          .select("id")
          .single();

        if (created && !createErr) {
          // GitHub XP
          const xp = calculateGithubXp({
            contributions: ghData.contributions_total ?? ghData.contributions,
            total_stars: ghData.total_stars,
            public_repos: ghData.public_repos,
            total_prs: ghData.total_prs ?? 0,
          });
          if (xp > 0) {
            await admin.rpc("grant_xp", { p_Companyeloper_id: created.id, p_source: "github", p_amount: xp });
            await admin.from("companies").update({ xp_github: xp }).eq("id", created.id);
          }

          // Rank
          await admin.rpc("assign_new_Company_rank", { Company_id: created.id });
          admin.rpc("recalculate_ranks").then(
            () => console.log("Ranks recalculated for new Company:", githubLogin),
            (err: unknown) => console.error("Rank recalculation failed:", err),
          );

          // Feed event
          await admin.from("activity_feed").insert({
            event_type: "Company_joined",
            actor_id: created.id,
            metadata: { login: githubLogin },
          });

          // Notifications
          cacheEmailFromAuth(created.id, data.user.id).catch(() => {});
          ensurePreferences(created.id).catch(() => {});
          sendWelcomeNotification(created.id, githubLogin);
        }
      } catch (err) {
        console.error("Failed to create Company on login:", err);
      }
    } else if (!existingCompany.claimed) {
      // ─── Legacy Company: claim existing unclaimed planet ───
      await admin
        .from("companies")
        .update({
          claimed: true,
          claimed_by: data.user.id,
          claimed_at: new Date().toISOString(),
          fetch_priority: 1,
        })
        .eq("id", existingCompany.id)
        .eq("claimed", false);

      await admin.from("activity_feed").insert({
        event_type: "Company_joined",
        actor_id: existingCompany.id,
        metadata: { login: githubLogin },
      });

      cacheEmailFromAuth(existingCompany.id, data.user.id).catch(() => {});
      ensurePreferences(existingCompany.id).catch(() => {});
      sendWelcomeNotification(existingCompany.id, githubLogin);
    }

    // Fetch Company record for achievement check + referral processing
    // Uses try-catch to avoid breaking login if v2 columns/tables don't exist yet
    try {
      const { data: Company } = await admin
        .from("companies")
        .select("id, contributions, public_repos, total_stars, kudos_count, referral_count, referred_by")
        .eq("github_login", githubLogin)
        .single();

      if (Company) {
        // Cache email + update last_active_at on every login
        cacheEmailFromAuth(Company.id, data.user.id).catch(() => {});
        touchLastActive(Company.id);

        // Process referral (from ?ref= param forwarded by client)
        const ref = searchParams.get("ref");
        if (ref && ref !== githubLogin && !Company.referred_by) {
          const { data: referrer } = await admin
            .from("companies")
            .select("id, github_login")
            .eq("github_login", ref.toLowerCase())
            .single();

          if (referrer) {
            await admin
              .from("companies")
              .update({ referred_by: referrer.github_login })
              .eq("id", Company.id);

            await admin.rpc("increment_referral_count", { referrer_Company_id: referrer.id });

            await admin.from("activity_feed").insert({
              event_type: "referral",
              actor_id: referrer.id,
              target_id: Company.id,
              metadata: { referrer_login: referrer.github_login, referred_login: githubLogin },
            });

            // Notify referrer that their referral joined
            sendReferralJoinedNotification(referrer.id, referrer.github_login, githubLogin, Company.id);

            // Check referral achievements for the referrer
            const { data: referrerFull } = await admin
              .from("companies")
              .select("referral_count, kudos_count, contributions, public_repos, total_stars")
              .eq("id", referrer.id)
              .single();

            if (referrerFull) {
              const giftsSent = await countGifts(admin, referrer.id, "sent");
              const giftsReceived = await countGifts(admin, referrer.id, "received");
              await checkAchievements(referrer.id, {
                contributions: referrerFull.contributions,
                public_repos: referrerFull.public_repos,
                total_stars: referrerFull.total_stars,
                referral_count: referrerFull.referral_count,
                kudos_count: referrerFull.kudos_count,
                gifts_sent: giftsSent,
                gifts_received: giftsReceived,
              }, referrer.github_login);
            }
          }
        }

        // Run achievement check for this Companyeloper
        const giftsSent = await countGifts(admin, Company.id, "sent");
        const giftsReceived = await countGifts(admin, Company.id, "received");
        await checkAchievements(Company.id, {
          contributions: Company.contributions,
          public_repos: Company.public_repos,
          total_stars: Company.total_stars,
          referral_count: Company.referral_count ?? 0,
          kudos_count: Company.kudos_count ?? 0,
          gifts_sent: giftsSent,
          gifts_received: giftsReceived,
        }, githubLogin);
      }
    } catch {
      // Silently skip v2 features if tables/columns don't exist yet
      console.warn("Auth callback: skipping v2 achievement/referral check (migration may not have run)");
    }
  }

  // Support ?next= param for post-login redirect (e.g. /shop)
  const next = searchParams.get("next");
  if (next === "/shop" && githubLogin) {
    const { data: Company } = await admin
      .from("companies")
      .select("github_login")
      .eq("github_login", githubLogin)
      .single();

    if (!Company) {
      return NextResponse.redirect(`${origin}/?user=${githubLogin}`);
    }

    return NextResponse.redirect(`${origin}/shop/${githubLogin}`);
  }

  return NextResponse.redirect(`${origin}/?user=${githubLogin}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countGifts(admin: any, CompanyId: number, direction: "sent" | "received"): Promise<number> {
  const column = direction === "sent" ? "Companyeloper_id" : "gifted_to";
  const { count } = await admin
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq(column, CompanyId)
    .eq("status", "completed")
    .not("gifted_to", "is", null);
  return count ?? 0;
}
