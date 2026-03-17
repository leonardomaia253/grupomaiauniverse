import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkAchievements } from "@/lib/achievements";
import { cacheEmailFromAuth, touchLastActive, ensurePreferences } from "@/lib/notification-helpers";
import { sendWelcomeNotification } from "@/lib/notification-senders/welcome";
import { sendReferralJoinedNotification } from "@/lib/notification-senders/referral";
import { fetchGitHubcompanyData } from "@/lib/github-api";
import { calculateGithubXp } from "@/lib/xp";

import { isAdmin } from "@/lib/admin";

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

  const identity = data.user.identities?.[0];
  const provider = identity?.provider ?? "email";
  const userEmail = data.user.email;
  const isUserAdmin = isAdmin(userEmail);

  const username = (
    data.user.user_metadata.user_name ??
    data.user.user_metadata.preferred_username ??
    data.user.user_metadata.full_name ??
    data.user.email?.split("@")[0] ??
    ""
  ).toLowerCase();

  const admin = getSupabaseAdmin();

  if (username) {
    // Check if record already exists in the database
    const { data: existingRecord } = await admin
      .from("companies")
      .select("id, claimed, username")
      .eq("username", username)
      .maybeSingle();

    if (existingRecord) {
      if (!existingRecord.claimed) {
        // ─── Legacy/Existing Unclaimed: claim it ───
        await admin
          .from("companies")
          .update({
            claimed: true,
            claimed_by: data.user.id,
            claimed_at: new Date().toISOString(),
            fetch_priority: 1,
            provider,
          })
          .eq("id", existingRecord.id)
          .eq("claimed", false);

        await admin.from("activity_feed").insert({
          event_type: "company_joined",
          actor_id: existingRecord.id,
          metadata: { login: username },
        });

        cacheEmailFromAuth(existingRecord.id, data.user.id).catch(() => {});
        ensurePreferences(existingRecord.id).catch(() => {});
        sendWelcomeNotification(existingRecord.id, username);
      }
    } else if (isUserAdmin) {
      // ─── New Admin: create planet (admins always get a planet) ───
      try {
        let userData: any = {
          username,
          avatar_url: data.user.user_metadata.avatar_url,
          name: data.user.user_metadata.full_name,
          provider,
        };

        // If GitHub, fetch additional data
        if (provider === "github") {
          try {
            const ghData = await fetchGitHubcompanyData(username, { allowEmpty: true });
            userData = {
              ...userData,
              ...ghData,
            };
            // ghData now contains external_id and username instead of external_id and username
          } catch (ghErr) {
            console.error("Failed to fetch dados do Grupo Maia for user:", username, ghErr);
          }
        }

        const { data: created, error: createErr } = await admin
          .from("companies")
          .upsert({
            ...userData,
            username, // Ensure username is set
            fetched_at: new Date().toISOString(),
            claimed: true,
            claimed_by: data.user.id,
            claimed_at: new Date().toISOString(),
            fetch_priority: 1,
          }, { onConflict: "username" })
          .select("id")
          .single();

        if (created && !createErr) {
          // Grant initial XP if dados do Grupo Maia was fetched
          if (provider === "github" && userData.contributions) {
            const xp = calculateGithubXp({
              contributions: userData.contributions_total ?? userData.contributions,
              total_stars: userData.total_stars,
              public_repos: userData.public_repos,
              total_prs: userData.total_prs ?? 0,
            });
            if (xp > 0) {
              await admin.rpc("grant_xp", { p_company_id: created.id, p_source: "github", p_amount: xp });
              await admin.from("companies").update({ xp_universe: xp }).eq("id", created.id);
            }
          }

          // Rank
          await admin.rpc("assign_new_company_rank", { company_id: created.id });
          admin.rpc("recalculate_ranks").then(
            () => console.log("Ranks recalculated for new user:", username),
            (err: unknown) => console.error("Rank recalculation failed:", err),
          );

          // Feed event
          await admin.from("activity_feed").insert({
            event_type: "company_joined",
            actor_id: created.id,
            metadata: { login: username },
          });

          // Notifications
          cacheEmailFromAuth(created.id, data.user.id).catch(() => {});
          ensurePreferences(created.id).catch(() => {});
          sendWelcomeNotification(created.id, username);
        }
      } catch (err) {
        console.error("Failed to create record on login:", err);
      }
    }

    // Process additional features (achievements, referrals)
    try {
      const { data: record } = await admin
        .from("companies")
        .select("id, contributions, public_repos, total_stars, kudos_count, referral_count, referred_by")
        .eq("username", username)
        .single();

      if (record) {
        cacheEmailFromAuth(record.id, data.user.id).catch(() => {});
        touchLastActive(record.id);

        const ref = searchParams.get("ref");
        if (ref && ref !== username && !record.referred_by) {
          const { data: referrer } = await admin
            .from("companies")
            .select("id, username")
            .eq("username", ref.toLowerCase())
            .single();

          if (referrer) {
            await admin
              .from("companies")
              .update({ referred_by: referrer.username })
              .eq("id", record.id);

            await admin.rpc("increment_referral_count", { referrer_company_id: referrer.id });

            await admin.from("activity_feed").insert({
              event_type: "referral",
              actor_id: referrer.id,
              target_id: record.id,
              metadata: { referrer_login: referrer.username, referred_login: username },
            });

            sendReferralJoinedNotification(referrer.id, referrer.username, username, record.id);

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
              }, referrer.username);
            }
          }
        }

        const giftsSent = await countGifts(admin, record.id, "sent");
        const giftsReceived = await countGifts(admin, record.id, "received");
        await checkAchievements(record.id, {
          contributions: record.contributions,
          public_repos: record.public_repos,
          total_stars: record.total_stars,
          referral_count: record.referral_count ?? 0,
          kudos_count: record.kudos_count ?? 0,
          gifts_sent: giftsSent,
          gifts_received: giftsReceived,
        }, username);
      }
    } catch (err) {
      console.warn("Auth callback: skipping v2 features:", err);
    }
  }

  const next = searchParams.get("next");
  if (next === "/shop" && username) {
    const { data: record } = await admin
      .from("companies")
      .select("username")
      .eq("username", username)
      .single();

    if (!record) {
      return NextResponse.redirect(`${origin}/?user=${username}`);
    }

    return NextResponse.redirect(`${origin}/shop/${username}`);
  }

  return NextResponse.redirect(`${origin}/?user=${username}`);
}

async function countGifts(admin: any, recordId: number, direction: "sent" | "received"): Promise<number> {
  const column = direction === "sent" ? "company_id" : "gifted_to";
  const { count } = await admin
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq(column, recordId)
    .eq("status", "completed")
    .not("gifted_to", "is", null);
  return count ?? 0;
}
