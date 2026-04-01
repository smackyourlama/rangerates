import { NextResponse } from "next/server";
import type { WorkspaceRole } from "@/lib/workspace";
import { signupWorkspaceUser, setWorkspaceUserCookie } from "@/lib/server/user-auth";

export async function POST(request: Request) {
  const payload = await request.json();
  const fullName = String(payload?.fullName || "").trim();
  const email = String(payload?.email || "").trim();
  const password = String(payload?.password || "");
  const companyName = String(payload?.companyName || "").trim();
  const role = String(payload?.role || "dispatch") as WorkspaceRole;

  if (!fullName) {
    return NextResponse.json({ error: "Enter your name first." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Enter your email first." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for the password." }, { status: 400 });
  }

  const result = await signupWorkspaceUser({ fullName, email, password, companyName, role });
  if (!result.ok) {
    return NextResponse.json({ error: "That email already has an account. Log in instead." }, { status: 409 });
  }

  setWorkspaceUserCookie(result.token);
  return NextResponse.json({ success: true, user: result.user });
}
