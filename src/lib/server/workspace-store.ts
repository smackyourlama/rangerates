import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createDefaultSettings,
  createEmptyWorkspaceState,
  normalizeEmail,
  sanitizeWorkspaceState,
  type WorkspaceSettings,
  type WorkspaceState,
  type WorkspaceUser,
} from "@/lib/workspace";
import { hashPassword } from "@/lib/server/passwords";

const DATA_DIR = path.join(process.cwd(), "data");
const WORKSPACE_FILE = path.join(DATA_DIR, "rangerates-workspace.json");

export type WorkspaceUserRecord = WorkspaceUser & {
  passwordHash?: string;
  sessionToken?: string | null;
};

export type WorkspaceStateRecord = Omit<WorkspaceState, "users"> & {
  users: WorkspaceUserRecord[];
};

function sanitizeUserRecord(raw: any): WorkspaceUserRecord | null {
  const base = sanitizeWorkspaceState({ users: [raw] }).users[0];
  if (!base) {
    return null;
  }

  let passwordHash = typeof raw?.passwordHash === "string" ? raw.passwordHash : "";
  if (!passwordHash && typeof raw?.password === "string" && raw.password.trim()) {
    passwordHash = hashPassword(raw.password);
  }

  return {
    ...base,
    passwordHash,
    sessionToken: typeof raw?.sessionToken === "string" && raw.sessionToken ? raw.sessionToken : null,
  };
}

function sanitizeSettingsArray(rawSettings: any[] | undefined): WorkspaceSettings[] {
  return sanitizeWorkspaceState({ settings: Array.isArray(rawSettings) ? rawSettings : [] }).settings;
}

function sanitizeRecordState(raw: any): { state: WorkspaceStateRecord; migrated: boolean } {
  const safe = sanitizeWorkspaceState(raw);
  const rawUsers: unknown[] = Array.isArray(raw?.users) ? raw.users : [];
  const users = rawUsers.map((entry) => sanitizeUserRecord(entry)).filter((entry): entry is WorkspaceUserRecord => entry !== null);
  const settings = sanitizeSettingsArray(raw?.settings);

  const state: WorkspaceStateRecord = {
    ...safe,
    users,
    settings,
  };

  const userIds = new Set(state.users.map((user) => user.id));
  state.settings = state.settings.filter((setting) => userIds.has(setting.userId));
  for (const user of state.users) {
    if (!state.settings.some((setting) => setting.userId === user.id)) {
      state.settings.push(createDefaultSettings(user.id));
    }
    user.email = normalizeEmail(user.email);
  }

  const migrated = JSON.stringify(raw ?? {}) !== JSON.stringify(state);
  return { state, migrated };
}

function serializeRecordState(state: WorkspaceStateRecord) {
  return {
    version: state.version,
    sessionUserId: state.sessionUserId,
    users: state.users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: normalizeEmail(user.email),
      companyName: user.companyName,
      role: user.role,
      authProvider: user.authProvider,
      googleSubject: user.googleSubject,
      createdAt: user.createdAt,
      passwordHash: user.passwordHash || "",
      sessionToken: user.sessionToken || null,
    })),
    settings: state.settings.map((setting) => ({
      userId: setting.userId,
      baseLocation: setting.baseLocation,
    })),
    customers: state.customers,
    quotes: state.quotes,
    messages: state.messages,
  } satisfies WorkspaceStateRecord;
}

export async function readWorkspaceStateFile(): Promise<WorkspaceStateRecord> {
  try {
    const raw = await readFile(WORKSPACE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const { state, migrated } = sanitizeRecordState(parsed);
    if (migrated) {
      await writeWorkspaceStateFile(state);
    }
    return state;
  } catch {
    return {
      ...createEmptyWorkspaceState(),
      users: [],
    };
  }
}

export async function writeWorkspaceStateFile(state: WorkspaceStateRecord): Promise<WorkspaceStateRecord> {
  const next = sanitizeRecordState(state).state;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(WORKSPACE_FILE, JSON.stringify(serializeRecordState(next), null, 2), "utf-8");
  return next;
}

export function buildClientWorkspaceState(state: WorkspaceStateRecord, userId: string): WorkspaceState {
  const user = state.users.find((entry) => entry.id === userId);
  if (!user) {
    return createEmptyWorkspaceState();
  }

  return {
    version: state.version,
    sessionUserId: user.id,
    users: [
      {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        authProvider: user.authProvider,
        googleSubject: user.googleSubject,
        createdAt: user.createdAt,
      },
    ],
    settings: state.settings.filter((entry) => entry.userId === user.id),
    customers: state.customers.filter((entry) => entry.userId === user.id),
    quotes: state.quotes.filter((entry) => entry.userId === user.id),
    messages: state.messages.filter((entry) => entry.userId === user.id),
  };
}
