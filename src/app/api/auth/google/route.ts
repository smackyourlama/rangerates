import { NextResponse } from "next/server";
import { setWorkspaceUserCookie, upsertGoogleWorkspaceUser } from "@/lib/server/user-auth";

export async function POST(request: Request) {
  const payload = await request.json();
  const credential = String(payload?.credential || "").trim();
  const expectedAudience = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!credential || !expectedAudience) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 400 });
  }

  const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
    cache: "no-store",
  });
  const tokenInfo = await verification.json();

  if (!verification.ok) {
    return NextResponse.json({ error: tokenInfo?.error_description || "Unable to verify the Google credential." }, { status: 401 });
  }

  const issuer = String(tokenInfo?.iss || "");
  const audience = String(tokenInfo?.aud || "");
  const email = String(tokenInfo?.email || "");
  const fullName = String(tokenInfo?.name || tokenInfo?.given_name || "Google user");
  const subject = String(tokenInfo?.sub || "");
  const emailVerified = String(tokenInfo?.email_verified || "");

  if (!subject || !email || emailVerified !== "true" || audience !== expectedAudience || !["accounts.google.com", "https://accounts.google.com"].includes(issuer)) {
    return NextResponse.json({ error: "Google sign-in could not be verified for this app." }, { status: 401 });
  }

  const result = await upsertGoogleWorkspaceUser({ email, fullName, googleSubject: subject });
  setWorkspaceUserCookie(result.token);
  return NextResponse.json({ success: true, user: result.user });
}
