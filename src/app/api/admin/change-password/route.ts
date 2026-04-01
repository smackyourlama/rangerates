import { NextResponse } from "next/server";
import { changeAdminPassword, getAdminSession } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  const newPassword = String(payload?.newPassword || "");
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for the new admin password." }, { status: 400 });
  }
  await changeAdminPassword(newPassword);
  return NextResponse.json({ success: true });
}
