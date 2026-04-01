import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { readAdminStateFile, upsertStripeSubscription, updateSubscription } from "@/lib/server/admin-store";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.split("=")[1];
  const signature = parts.find((part) => part.startsWith("v1="))?.split("=")[1];
  if (!timestamp || !signature) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function fetchStripeSubscription(secretKey: string, subscriptionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function POST(request: Request) {
  const admin = await readAdminStateFile();
  if (!admin.stripe.webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 400 });
  }
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(rawBody, signature, admin.stripe.webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as any;
  const eventType = event?.type;
  const object = event?.data?.object || {};

  if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
    const stripeSubscriptionId = String(object?.subscription || "");
    const subscription = stripeSubscriptionId ? await fetchStripeSubscription(admin.stripe.secretKey, stripeSubscriptionId) : null;
    await upsertStripeSubscription({
      userId: String(object?.metadata?.userId || ""),
      email: String(object?.customer_email || object?.metadata?.email || ""),
      planName: String(object?.metadata?.planName || "RangeRates Plan"),
      amount: Number(object?.metadata?.amount || 0),
      interval: String(object?.metadata?.interval || "monthly") === "yearly" ? "yearly" : "monthly",
      status: "active",
      renewsAt: subscription?.current_period_end ? new Date(Number(subscription.current_period_end) * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripeCustomerId: String(object?.customer || subscription?.customer || ""),
      stripeSubscriptionId,
    });
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(eventType)) {
    const stripeSubscriptionId = String(object?.id || "");
    const mappedStatus = String(object?.status || "");
    for (const subscription of admin.subscriptions.filter((entry) => entry.stripeSubscriptionId === stripeSubscriptionId)) {
      await updateSubscription(subscription.id, {
        status: mappedStatus === "active" ? "active" : mappedStatus === "trialing" ? "trialing" : mappedStatus === "past_due" ? "past_due" : "canceled",
        renewsAt: object?.current_period_end ? new Date(Number(object.current_period_end) * 1000).toISOString() : subscription.renewsAt,
        stripeCustomerId: String(object?.customer || subscription.stripeCustomerId || ""),
      });
    }
  }

  if (eventType === "invoice.paid" || eventType === "invoice.payment_failed") {
    const stripeSubscriptionId = String(object?.subscription || "");
    const nextStatus = eventType === "invoice.paid" ? "active" : "past_due";
    for (const subscription of admin.subscriptions.filter((entry) => entry.stripeSubscriptionId === stripeSubscriptionId)) {
      await updateSubscription(subscription.id, { status: nextStatus });
    }
  }

  return NextResponse.json({ received: true });
}
