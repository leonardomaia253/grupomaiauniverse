import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SKY_AD_PLANS, isValidPlanId } from "@/lib/skyAdPlans";
import { claimWebhookEvent } from "@/lib/webhook-events";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  try {
    if (!(await claimWebhookEvent(sb, "stripe", event.id, event.type))) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type !== "sky_ad") return NextResponse.json({ received: true, ignored: true });

      let { data: ad } = await sb.from("sky_ads").select("id, plan_id, active").eq("stripe_session_id", session.id).maybeSingle();
      if (!ad && session.metadata.sky_ad_id) {
        const result = await sb.from("sky_ads").select("id, plan_id, active").eq("id", session.metadata.sky_ad_id).maybeSingle();
        ad = result.data;
      }
      if (!ad || ad.active || !ad.plan_id || !isValidPlanId(ad.plan_id)) {
        return NextResponse.json({ received: true });
      }

      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const now = new Date();
      let endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data"] });
        const periodEnd = subscription.items?.data?.[0]?.current_period_end;
        if (periodEnd) endsAt = new Date(periodEnd * 1000);
      }

      await sb.from("sky_ads").update({
        active: true,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        purchaser_email: session.customer_details?.email ?? null,
        stripe_subscription_id: subscriptionId ?? null,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      }).eq("id", ad.id);

      if (SKY_AD_PLANS[ad.plan_id].vehicle === "plane") {
        await sb.from("sky_ads").update({ active: false }).eq("id", "advertise").eq("active", true);
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;
      if (subscriptionId) {
        const { data: ad } = await sb.from("sky_ads").select("id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
        if (ad) {
          const details = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data"] });
          const periodEnd = details.items?.data?.[0]?.current_period_end;
          await sb.from("sky_ads").update({ active: true, ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null }).eq("id", ad.id);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await sb.from("sky_ads").update({ active: false }).eq("stripe_subscription_id", subscription.id);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === "sky_ad") {
        await sb.from("sky_ads").delete().eq("stripe_session_id", session.id).eq("active", false);
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
        const session = sessions.data[0];
        if (session?.metadata?.type === "sky_ad") {
          await sb.from("sky_ads").update({ active: false }).eq("stripe_session_id", session.id);
        }
      }
    }
  } catch (error) {
    console.error("Stripe campaign webhook error:", error);
  }

  return NextResponse.json({ received: true });
}

