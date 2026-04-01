import { NextResponse } from "next/server";
import { deleteSubscription, getAdminSession, updateSubscription } from "@/lib/server/admin-store";

export async function POST(request: Request, { params }: { params: { subscriptionId: string } }) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  await updateSubscription(params.subscriptionId, payload || {});
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { subscriptionId: string } }) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteSubscription(params.subscriptionId);
  return NextResponse.json({ success: true });
}
