import { NextResponse } from "next/server";
import { getUserSubscription, readAdminStateFile } from "@/lib/server/admin-store";
import { readWorkspaceStateFile } from "@/lib/server/workspace-store";

function stripeBody(payload: Record<string, string>) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    form.set(key, value);
  }
  return form;
}

export async function POST(request: Request) {
  const admin = await readAdminStateFile();
  if (!admin.stripe.secretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured in admin." }, { status: 400 });
  }

  const payload = await request.json();
  const planId = String(payload?.planId || "");
  const userId = String(payload?.userId || "");
  const origin = String(payload?.origin || "").replace(/\/$/, "");
  const plan = admin.plans.find((entry) => entry.id === planId && entry.active);
  const workspace = await readWorkspaceStateFile();
  const user = workspace.users.find((entry) => entry.id === userId);
  const existingSubscription = await getUserSubscription(userId);

  if (!plan || !userId || !origin || !user) {
    return NextResponse.json({ error: "Missing billing parameters." }, { status: 400 });
  }

  if (existingSubscription && existingSubscription.status !== "canceled") {
    return NextResponse.json({ error: "This user already has an active subscription record." }, { status: 409 });
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${admin.stripe.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: stripeBody({
      mode: "subscription",
      success_url: `${origin}/dashboard/billing?success=1`,
      cancel_url: `${origin}/dashboard/billing?canceled=1`,
      customer_email: user.email,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(plan.price * 100)),
      "line_items[0][price_data][product_data][name]": `RangeRates ${plan.name}`,
      "line_items[0][price_data][recurring][interval]": plan.interval === "yearly" ? "year" : "month",
      "metadata[userId]": userId,
      "metadata[email]": user.email,
      "metadata[planName]": plan.name,
      "metadata[amount]": String(plan.price),
      "metadata[interval]": plan.interval,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || "Unable to create Stripe checkout session." }, { status: response.status });
  }
  return NextResponse.json({ url: data?.url, id: data?.id });
}
