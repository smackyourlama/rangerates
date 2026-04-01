import { NextResponse } from "next/server";
import { getWorkspaceUserSession } from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getWorkspaceUserSession();
  return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
}
