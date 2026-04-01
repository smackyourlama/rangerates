import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/admin-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAdminSession(), { headers: { "Cache-Control": "no-store" } });
}
