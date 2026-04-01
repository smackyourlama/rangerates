import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, clearAdminSession } from "@/lib/server/admin-store";

export async function POST() {
  await clearAdminSession();
  cookies().set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: false, path: "/", expires: new Date(0) });
  return NextResponse.json({ success: true });
}
