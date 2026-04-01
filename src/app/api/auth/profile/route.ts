import { NextResponse } from "next/server";
import type { WorkspaceRole } from "@/lib/workspace";
import { getWorkspaceUserSession, setWorkspaceUserCookie, updateCurrentWorkspaceUser } from "@/lib/server/user-auth";
import { readWorkspaceStateFile } from "@/lib/server/workspace-store";

export async function POST(request: Request) {
  const session = await getWorkspaceUserSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const password = String(payload?.password || "");
  if (password && password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for the password." }, { status: 400 });
  }

  const user = await updateCurrentWorkspaceUser(session.user.id, {
    fullName: typeof payload?.fullName === "string" ? payload.fullName : undefined,
    companyName: typeof payload?.companyName === "string" ? payload.companyName : undefined,
    role: (["dispatch", "owner", "coordinator", "operations"] as const).includes(payload?.role as WorkspaceRole)
      ? (payload.role as WorkspaceRole)
      : undefined,
    password: password || undefined,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (password) {
    const workspace = await readWorkspaceStateFile();
    const updated = workspace.users.find((entry) => entry.id === session.user.id);
    if (updated?.sessionToken) {
      setWorkspaceUserCookie(updated.sessionToken);
    }
  }

  return NextResponse.json({ success: true, user });
}
