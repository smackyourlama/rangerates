import { NextResponse } from "next/server";
import { getAdminSession, updateAdminSettings } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  await updateAdminSettings({
    twilioAccountSid: String(payload?.twilioAccountSid || ""),
    twilioAuthToken: String(payload?.twilioAuthToken || ""),
    twilioFromNumber: String(payload?.twilioFromNumber || ""),
    stripePublishableKey: String(payload?.stripePublishableKey || ""),
    stripeSecretKey: String(payload?.stripeSecretKey || ""),
    stripeWebhookSecret: String(payload?.stripeWebhookSecret || ""),
  });
  return NextResponse.json({ success: true });
}
