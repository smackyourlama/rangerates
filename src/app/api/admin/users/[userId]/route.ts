import { NextResponse } from "next/server";
import { deleteWorkspaceUser, getAdminSession, updateWorkspaceUser } from "@/lib/server/admin-store";

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  await updateWorkspaceUser(params.userId, payload || {});
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { userId: string } }) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteWorkspaceUser(params.userId);
  return NextResponse.json({ success: true });
}
