import { NextResponse } from "next/server";
import { getUserSubscription, readAdminStateFile } from "@/lib/server/admin-store";
import { getWorkspaceUserSession } from "@/lib/server/user-auth";

export async function POST(request: Request) {
  const session = await getWorkspaceUserSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await readAdminStateFile();
  if (!admin.stripe.secretKey) {
    return NextResponse.json({ error: "Stripe secret key is not configured in admin." }, { status: 400 });
  }
  const payload = await request.json();
  const origin = String(payload?.origin || "").replace(/\/$/, "");
  const subscription = await getUserSubscription(session.user.id);
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found for this user yet." }, { status: 404 });
  }

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${admin.stripe.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ customer: subscription.stripeCustomerId, return_url: `${origin}/dashboard/billing` }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || "Unable to open Stripe billing portal." }, { status: response.status });
  }
  return NextResponse.json({ url: data?.url });
}
