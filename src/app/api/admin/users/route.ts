import { NextResponse } from "next/server";
import { createWorkspaceUser, getAdminSession } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  const password = String(payload?.password || "").trim();
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for the user password." }, { status: 400 });
  }
  await createWorkspaceUser({
    fullName: String(payload?.fullName || "").trim(),
    email: String(payload?.email || "").trim(),
    password,
    companyName: String(payload?.companyName || "").trim(),
    role: (String(payload?.role || "dispatch") as "dispatch" | "owner" | "coordinator" | "operations"),
  });
  return NextResponse.json({ success: true });
}
