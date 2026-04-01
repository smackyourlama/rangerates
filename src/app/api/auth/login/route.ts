import { NextResponse } from "next/server";
import { loginWorkspaceUser, setWorkspaceUserCookie } from "@/lib/server/user-auth";

export async function POST(request: Request) {
  const payload = await request.json();
  const email = String(payload?.email || "").trim();
  const password = String(payload?.password || "");

  const auth = await loginWorkspaceUser(email, password);
  if (!auth.ok) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  setWorkspaceUserCookie(auth.token);
  return NextResponse.json({ success: true, user: auth.user });
}
