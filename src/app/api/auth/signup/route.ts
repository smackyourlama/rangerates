import { NextResponse } from "next/server";
import type { WorkspaceRole } from "@/lib/workspace";
import { signupWorkspaceUser, setWorkspaceUserCookie } from "@/lib/server/user-auth";

function authRouteErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const code = (error as NodeJS.ErrnoException).code;
  if (["EROFS", "EACCES", "EPERM"].includes(String(code || ""))) {
    return "Server storage is not writable on this deployment, so new accounts cannot be saved there right now.";
  }

  return error.message || fallback;
}

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: authRouteErrorMessage(error, "Unable to create the account.") }, { status: 500 });
  }
}
