import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  createDefaultSettings,
  normalizeEmail,
  type SignupInput,
  type WorkspaceRole,
  type WorkspaceUser,
} from "@/lib/workspace";
import { hashPassword, verifyPassword } from "@/lib/server/passwords";
import { readWorkspaceStateFile, writeWorkspaceStateFile } from "@/lib/server/workspace-store";

export const WORKSPACE_USER_COOKIE = "rangerates_user_session";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

function publicUser(user: WorkspaceUser): WorkspaceUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    companyName: user.companyName,
    role: user.role,
    authProvider: user.authProvider,
    googleSubject: user.googleSubject,
    createdAt: user.createdAt,
  };
}

export async function getWorkspaceUserSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(WORKSPACE_USER_COOKIE)?.value || "";
  if (!token) {
    return { authenticated: false as const, user: null };
  }

  const workspace = await readWorkspaceStateFile();
  const user = workspace.users.find((entry) => entry.sessionToken === token);
  if (!user) {
    return { authenticated: false as const, user: null };
  }

  return {
    authenticated: true as const,
    user: publicUser(user),
  };
}

export async function loginWorkspaceUser(email: string, password: string) {
  const workspace = await readWorkspaceStateFile();
  const normalizedEmail = normalizeEmail(email);
  const user = workspace.users.find(
    (entry) => normalizeEmail(entry.email) === normalizedEmail && entry.authProvider === "password" && entry.passwordHash,
  );

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { ok: false as const };
  }

  user.sessionToken = crypto.randomUUID();
  await writeWorkspaceStateFile(workspace);

  return {
    ok: true as const,
    token: user.sessionToken,
    user: publicUser(user),
  };
}

export async function signupWorkspaceUser(input: SignupInput) {
  const workspace = await readWorkspaceStateFile();
  const email = normalizeEmail(input.email);

  if (workspace.users.some((entry) => normalizeEmail(entry.email) === email)) {
    return { ok: false as const, reason: "duplicate" as const };
  }

  const user = {
    id: `user_${crypto.randomUUID()}`,
    fullName: input.fullName.trim(),
    email,
    companyName: input.companyName.trim(),
    role: input.role,
    authProvider: "password" as const,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(input.password),
    sessionToken: crypto.randomUUID(),
  };

  workspace.users.push(user);
  workspace.settings.push(createDefaultSettings(user.id));
  workspace.sessionUserId = null;
  await writeWorkspaceStateFile(workspace);

  return {
    ok: true as const,
    token: user.sessionToken,
    user: publicUser(user),
  };
}

export async function upsertGoogleWorkspaceUser(payload: { email: string; fullName: string; googleSubject: string }) {
  const workspace = await readWorkspaceStateFile();
  const email = normalizeEmail(payload.email);
  let user = workspace.users.find((entry) => entry.googleSubject === payload.googleSubject || normalizeEmail(entry.email) === email);

  if (user) {
    user.fullName = payload.fullName.trim() || user.fullName;
    user.email = email;
    user.googleSubject = payload.googleSubject;
    user.authProvider = "google";
  } else {
    user = {
      id: `user_${crypto.randomUUID()}`,
      fullName: payload.fullName.trim() || "Google user",
      email,
      companyName: "",
      role: "dispatch" satisfies WorkspaceRole,
      authProvider: "google" as const,
      googleSubject: payload.googleSubject,
      createdAt: new Date().toISOString(),
      passwordHash: "",
      sessionToken: null,
    };
    workspace.users.push(user);
    workspace.settings.push(createDefaultSettings(user.id));
  }

  user.sessionToken = crypto.randomUUID();
  await writeWorkspaceStateFile(workspace);

  return {
    ok: true as const,
    token: user.sessionToken,
    user: publicUser(user),
  };
}

export async function updateCurrentWorkspaceUser(
  userId: string,
  patch: Partial<Pick<WorkspaceUser, "fullName" | "companyName" | "role">> & { password?: string },
) {
  const workspace = await readWorkspaceStateFile();
  const user = workspace.users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  if (typeof patch.fullName === "string") {
    user.fullName = patch.fullName.trim() || user.fullName;
  }
  if (typeof patch.companyName === "string") {
    user.companyName = patch.companyName.trim();
  }
  if (patch.role) {
    user.role = patch.role;
  }
  if (typeof patch.password === "string" && patch.password.trim()) {
    user.passwordHash = hashPassword(patch.password);
    user.sessionToken = crypto.randomUUID();
  }

  await writeWorkspaceStateFile(workspace);
  return publicUser(user);
}

export async function clearWorkspaceUserSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(WORKSPACE_USER_COOKIE)?.value || "";
  if (!token) {
    return;
  }

  const workspace = await readWorkspaceStateFile();
  let changed = false;
  for (const user of workspace.users) {
    if (user.sessionToken === token) {
      user.sessionToken = null;
      changed = true;
    }
  }
  if (changed) {
    await writeWorkspaceStateFile(workspace);
  }
}

export function setWorkspaceUserCookie(token: string) {
  cookies().set(WORKSPACE_USER_COOKIE, token, cookieOptions());
}

export function clearWorkspaceUserCookie() {
  cookies().set(WORKSPACE_USER_COOKIE, "", {
    ...cookieOptions(),
    expires: new Date(0),
  });
}
