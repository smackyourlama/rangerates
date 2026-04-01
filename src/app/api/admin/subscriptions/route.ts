import { NextResponse } from "next/server";
import { createPlan, createSubscription, getAdminSession } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  if (payload?.mode === "plan") {
    await createPlan({
      name: String(payload?.name || "").trim(),
      price: Number(payload?.price || 0),
      interval: String(payload?.interval || "monthly") === "yearly" ? "yearly" : "monthly",
    });
    return NextResponse.json({ success: true });
  }
  await createSubscription({
    userId: String(payload?.userId || "").trim(),
    email: String(payload?.email || "").trim(),
    planName: String(payload?.planName || "").trim(),
    amount: Number(payload?.amount || 0),
    interval: String(payload?.interval || "monthly") === "yearly" ? "yearly" : "monthly",
    status: (["trialing", "active", "past_due", "canceled"].includes(String(payload?.status)) ? payload.status : "active") as "trialing" | "active" | "past_due" | "canceled",
    renewsAt: String(payload?.renewsAt || new Date().toISOString()),
  });
  return NextResponse.json({ success: true });
}
