import { NextResponse } from "next/server";
import { changeAdminPassword, getAdminSession } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  const newPassword = String(payload?.newPassword || "");
  const strongEnough = newPassword.length >= 12 && /\d/.test(newPassword) && /[A-Z]/.test(newPassword);
  if (!strongEnough) {
    return NextResponse.json({ error: "Use at least 12 characters with one uppercase letter and one number." }, { status: 400 });
  }
  await changeAdminPassword(newPassword);
  return NextResponse.json({ success: true });
}
