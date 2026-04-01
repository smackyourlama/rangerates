import { NextResponse } from "next/server";
import { readAdminStateFile } from "@/lib/server/admin-store";
import { getWorkspaceUserSession } from "@/lib/server/user-auth";

function basicAuth(accountSid: string, authToken: string) {
  const raw = `${accountSid}:${authToken}`;
  return Buffer.from(raw).toString("base64");
}

export async function POST(request: Request) {
  try {
    const session = await getWorkspaceUserSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const admin = await readAdminStateFile();
    const accountSid = String(admin.twilioDefaults.accountSid || "").trim();
    const authToken = String(admin.twilioDefaults.authToken || "").trim();
    const fromNumber = String(admin.twilioDefaults.fromNumber || "").trim();
    const to = String(payload?.to || "").trim();
    const body = String(payload?.body || "").trim();

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Twilio settings are incomplete in admin." }, { status: 400 });
    }

    if (!to || !body) {
      return NextResponse.json({ error: "Phone number and message body are required." }, { status: 400 });
    }

    if (body.length > 1600) {
      return NextResponse.json({ error: "Message body is too long." }, { status: 400 });
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(accountSid, authToken)}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: to,
        Body: body,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.message || "Twilio send failed." }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      sid: data?.sid,
      status: data?.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send SMS right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
