import { NextResponse } from "next/server";
import { sanitizeWorkspaceState } from "@/lib/workspace";
import { readWorkspaceStateFile, writeWorkspaceStateFile } from "@/lib/server/workspace-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await readWorkspaceStateFile();
    return NextResponse.json({ success: true, state }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const state = sanitizeWorkspaceState(payload?.state);
    const saved = await writeWorkspaceStateFile(state);
    return NextResponse.json({ success: true, state: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
