import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createEmptyWorkspaceState, sanitizeWorkspaceState, type WorkspaceState } from "@/lib/workspace";

const DATA_DIR = path.join(process.cwd(), "data");
const WORKSPACE_FILE = path.join(DATA_DIR, "rangerates-workspace.json");

export async function readWorkspaceStateFile(): Promise<WorkspaceState> {
  try {
    const raw = await readFile(WORKSPACE_FILE, "utf-8");
    return sanitizeWorkspaceState(JSON.parse(raw));
  } catch {
    return createEmptyWorkspaceState();
  }
}

export async function writeWorkspaceStateFile(state: WorkspaceState): Promise<WorkspaceState> {
  const next = sanitizeWorkspaceState(state);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(WORKSPACE_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
