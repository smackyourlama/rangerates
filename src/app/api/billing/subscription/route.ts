import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "";
  if (!userId) {
    return NextResponse.json({ subscription: null }, { headers: { "Cache-Control": "no-store" } });
  }
  const subscription = await getUserSubscription(userId);
  return NextResponse.json({ subscription }, { headers: { "Cache-Control": "no-store" } });
}
