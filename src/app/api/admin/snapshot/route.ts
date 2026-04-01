import { NextResponse } from "next/server";
import { buildAdminSnapshot, getAdminSession } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await buildAdminSnapshot(), { headers: { "Cache-Control": "no-store" } });
}
