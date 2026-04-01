import { NextResponse } from "next/server";
import { clearWorkspaceUserCookie, clearWorkspaceUserSession } from "@/lib/server/user-auth";

export async function POST() {
  await clearWorkspaceUserSession();
  clearWorkspaceUserCookie();
  return NextResponse.json({ success: true });
}
