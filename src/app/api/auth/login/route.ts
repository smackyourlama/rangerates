import { NextResponse } from "next/server";
import { loginWorkspaceUser, setWorkspaceUserCookie } from "@/lib/server/user-auth";

function authRouteErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const code = (error as NodeJS.ErrnoException).code;
  if (["EROFS", "EACCES", "EPERM"].includes(String(code || ""))) {
    return "Server storage is not writable on this deployment, so account sessions cannot be saved there right now.";
  }

  return error.message || fallback;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const email = String(payload?.email || "").trim();
    const password = String(payload?.password || "");

    const auth = await loginWorkspaceUser(email, password);
    if (!auth.ok) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    setWorkspaceUserCookie(auth.token);
    return NextResponse.json({ success: true, user: auth.user });
  } catch (error) {
    return NextResponse.json({ error: authRouteErrorMessage(error, "Unable to log in.") }, { status: 500 });
  }
}
