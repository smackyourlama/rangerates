import { NextResponse } from "next/server";
import { readAdminStateFile } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await readAdminStateFile();
  return NextResponse.json(
    {
      billingEnabled: Boolean(admin.stripe.publishableKey && admin.stripe.secretKey),
      plans: admin.plans.filter((plan) => plan.active),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
