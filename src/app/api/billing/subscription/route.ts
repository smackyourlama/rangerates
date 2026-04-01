import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/server/admin-store";
import { getWorkspaceUserSession } from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getWorkspaceUserSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getUserSubscription(session.user.id);
  return NextResponse.json({ subscription }, { headers: { "Cache-Control": "no-store" } });
}
