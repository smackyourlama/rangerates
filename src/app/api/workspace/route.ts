import { NextResponse } from "next/server";
import { sanitizeWorkspaceState } from "@/lib/workspace";
import { getWorkspaceUserSession } from "@/lib/server/user-auth";
import { buildClientWorkspaceState, readWorkspaceStateFile, writeWorkspaceStateFile } from "@/lib/server/workspace-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getWorkspaceUserSession();
    if (!session.authenticated || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await readWorkspaceStateFile();
    return NextResponse.json(
      { success: true, state: buildClientWorkspaceState(state, session.user.id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getWorkspaceUserSession();
    if (!session.authenticated || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const filteredState = sanitizeWorkspaceState(payload?.state);
    const workspace = await readWorkspaceStateFile();
    const userId = session.user.id;

    workspace.settings = [
      ...workspace.settings.filter((entry) => entry.userId !== userId),
      ...filteredState.settings
        .filter((entry) => entry.userId === userId)
        .map((entry) => ({ userId, baseLocation: entry.baseLocation })),
    ];

    workspace.customers = [
      ...workspace.customers.filter((entry) => entry.userId !== userId),
      ...filteredState.customers.map((entry) => ({ ...entry, userId })),
    ];

    workspace.quotes = [
      ...workspace.quotes.filter((entry) => entry.userId !== userId),
      ...filteredState.quotes.map((entry) => ({ ...entry, userId })),
    ];

    workspace.messages = [
      ...workspace.messages.filter((entry) => entry.userId !== userId),
      ...filteredState.messages.map((entry) => ({ ...entry, userId })),
    ];

    const saved = await writeWorkspaceStateFile(workspace);
    return NextResponse.json({ success: true, state: buildClientWorkspaceState(saved, userId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
