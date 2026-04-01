import { NextResponse } from "next/server";
import { createWorkspaceUser, getAdminSession } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  await createWorkspaceUser({
    fullName: String(payload?.fullName || "").trim(),
    email: String(payload?.email || "").trim(),
    password: String(payload?.password || "").trim() || "changeme123",
    companyName: String(payload?.companyName || "").trim(),
    role: (String(payload?.role || "dispatch") as "dispatch" | "owner" | "coordinator" | "operations"),
  });
  return NextResponse.json({ success: true });
}
