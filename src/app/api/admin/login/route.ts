import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, authenticateAdmin } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const payload = await request.json();
  const username = String(payload?.username || "").trim();
  const password = String(payload?.password || "");
  const auth = await authenticateAdmin(username, password);
  if (!auth.ok) {
    if (auth.reason === "locked") {
      return NextResponse.json({ error: `Admin login locked until ${auth.lockoutUntil}.` }, { status: 429 });
    }
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }
  cookies().set(ADMIN_COOKIE, auth.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return NextResponse.json({ success: true, requirePasswordChange: auth.requirePasswordChange });
}
