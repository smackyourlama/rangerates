import {
  createDefaultSettings,
  createId,
  normalizeEmail,
  sanitizeWorkspaceState,
  type SignupInput,
  type WorkspaceAuthProvider,
  type WorkspaceRole,
  type WorkspaceState,
  type WorkspaceUser,
} from "@/lib/workspace";

const LOCAL_AUTH_VERSION = 1;
export const LOCAL_AUTH_STORAGE_KEY = "rangerates-local-auth-v1";

export type LocalAuthUserRecord = {
  userId: string;
  email: string;
  authProvider: WorkspaceAuthProvider;
  passwordHash?: string;
  googleSubject?: string;
  createdAt: string;
};

export type LocalAuthState = {
  version: number;
  users: LocalAuthUserRecord[];
};

function createEmptyLocalAuthState(): LocalAuthState {
  return {
    version: LOCAL_AUTH_VERSION,
    users: [],
  };
}

function sanitizeLocalAuthUser(value: Partial<LocalAuthUserRecord> | null | undefined): LocalAuthUserRecord | null {
  const userId = typeof value?.userId === "string" ? value.userId : "";
  const email = typeof value?.email === "string" ? normalizeEmail(value.email) : "";
  const authProvider = value?.authProvider === "google" ? "google" : "password";

  if (!userId || !email) {
    return null;
  }

  return {
    userId,
    email,
    authProvider,
    passwordHash: typeof value?.passwordHash === "string" && value.passwordHash ? value.passwordHash : undefined,
    googleSubject: typeof value?.googleSubject === "string" && value.googleSubject ? value.googleSubject : undefined,
    createdAt: typeof value?.createdAt === "string" && value.createdAt ? value.createdAt : new Date().toISOString(),
  };
}

function sanitizeLocalAuthState(parsed: Partial<LocalAuthState> | null | undefined): LocalAuthState {
  return {
    version: LOCAL_AUTH_VERSION,
    users: Array.isArray(parsed?.users)
      ? parsed.users.map((value) => sanitizeLocalAuthUser(value)).filter((value): value is LocalAuthUserRecord => Boolean(value))
      : [],
  };
}

export function loadLocalAuthState() {
  if (typeof window === "undefined") {
    return createEmptyLocalAuthState();
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) {
      return createEmptyLocalAuthState();
    }

    return sanitizeLocalAuthState(JSON.parse(raw));
  } catch {
    return createEmptyLocalAuthState();
  }
}

export function persistLocalAuthState(state: LocalAuthState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(sanitizeLocalAuthState(state)));
}

function requireWebCrypto() {
  if (!globalThis.crypto?.subtle || typeof globalThis.crypto.getRandomValues !== "function") {
    throw new Error("This browser cannot create secure local accounts.");
  }

  return globalThis.crypto;
}

function bytesToHex(value: ArrayBuffer | Uint8Array) {
  return Array.from(value instanceof Uint8Array ? value : new Uint8Array(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length % 2 !== 0) {
    throw new Error("Invalid password hash.");
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}

async function derivePasswordBits(password: string, salt: Uint8Array) {
  const cryptoApi = requireWebCrypto();
  const keyMaterial = await cryptoApi.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);

  return cryptoApi.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
}

async function hashLocalPassword(password: string) {
  const cryptoApi = requireWebCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const bits = await derivePasswordBits(password, salt);
  return `${bytesToHex(salt)}:${bytesToHex(bits)}`;
}

async function verifyLocalPassword(password: string, encoded: string) {
  const [saltHex, existingHash] = encoded.split(":");
  if (!saltHex || !existingHash) {
    return false;
  }

  try {
    const bits = await derivePasswordBits(password, hexToBytes(saltHex));
    return bytesToHex(bits) === existingHash;
  } catch {
    return false;
  }
}

function ensureSettingsForUser(state: WorkspaceState, userId: string) {
  if (state.settings.some((entry) => entry.userId === userId)) {
    return state.settings;
  }

  return [...state.settings, createDefaultSettings(userId)];
}

function ensureRole(role: WorkspaceRole | string): WorkspaceRole {
  return (["dispatch", "owner", "coordinator", "operations"] as const).includes(role as WorkspaceRole)
    ? (role as WorkspaceRole)
    : "dispatch";
}

function publicUserFromSignup(input: SignupInput): WorkspaceUser {
  return {
    id: createId("user"),
    fullName: input.fullName.trim(),
    email: normalizeEmail(input.email),
    companyName: input.companyName.trim(),
    role: ensureRole(input.role),
    authProvider: "password",
    createdAt: new Date().toISOString(),
  };
}

export async function signUpLocalWorkspaceUser(input: SignupInput, workspaceState: WorkspaceState, authState: LocalAuthState) {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!fullName) {
    throw new Error("Enter your name first.");
  }

  if (!email) {
    throw new Error("Enter your email first.");
  }

  if (password.length < 8) {
    throw new Error("Use at least 8 characters for the password.");
  }

  if (authState.users.some((entry) => normalizeEmail(entry.email) === email)) {
    throw new Error("That email already has an account. Log in instead.");
  }

  const user = publicUserFromSignup(input);
  const nextWorkspace = sanitizeWorkspaceState({
    ...workspaceState,
    sessionUserId: user.id,
    users: [...workspaceState.users.filter((entry) => entry.id !== user.id), user],
    settings: ensureSettingsForUser(workspaceState, user.id),
  });

  const nextAuth = sanitizeLocalAuthState({
    ...authState,
    users: [
      ...authState.users,
      {
        userId: user.id,
        email,
        authProvider: "password",
        passwordHash: await hashLocalPassword(password),
        createdAt: user.createdAt,
      },
    ],
  });

  return {
    state: nextWorkspace,
    auth: nextAuth,
    user,
  };
}

export async function loginLocalWorkspaceUser(
  input: { email: string; password: string },
  workspaceState: WorkspaceState,
  authState: LocalAuthState,
) {
  const email = normalizeEmail(input.email);
  const authRecord = authState.users.find((entry) => normalizeEmail(entry.email) === email && entry.authProvider === "password");

  if (!authRecord?.passwordHash) {
    throw new Error("Email or password is incorrect.");
  }

  const valid = await verifyLocalPassword(input.password, authRecord.passwordHash);
  if (!valid) {
    throw new Error("Email or password is incorrect.");
  }

  const user = workspaceState.users.find((entry) => entry.id === authRecord.userId);
  if (!user) {
    throw new Error("That account only exists in another saved browser session.");
  }

  return sanitizeWorkspaceState({
    ...workspaceState,
    sessionUserId: user.id,
    settings: ensureSettingsForUser(workspaceState, user.id),
  });
}

export async function upsertLocalGoogleWorkspaceUser(
  payload: { email: string; fullName: string; googleSubject: string },
  workspaceState: WorkspaceState,
  authState: LocalAuthState,
) {
  const email = normalizeEmail(payload.email);
  const existingAuth = authState.users.find(
    (entry) => entry.googleSubject === payload.googleSubject || normalizeEmail(entry.email) === email,
  );
  const existingUser = workspaceState.users.find(
    (entry) => entry.id === existingAuth?.userId || entry.googleSubject === payload.googleSubject || normalizeEmail(entry.email) === email,
  );

  const user: WorkspaceUser = existingUser
    ? {
        ...existingUser,
        fullName: payload.fullName.trim() || existingUser.fullName,
        email,
        authProvider: "google",
        googleSubject: payload.googleSubject,
      }
    : {
        id: createId("user"),
        fullName: payload.fullName.trim() || "Google user",
        email,
        companyName: "",
        role: "dispatch",
        authProvider: "google",
        googleSubject: payload.googleSubject,
        createdAt: new Date().toISOString(),
      };

  const nextWorkspace = sanitizeWorkspaceState({
    ...workspaceState,
    sessionUserId: user.id,
    users: [...workspaceState.users.filter((entry) => entry.id !== user.id), user],
    settings: ensureSettingsForUser(workspaceState, user.id),
  });

  const nextAuth = sanitizeLocalAuthState({
    ...authState,
    users: [
      ...authState.users.filter((entry) => entry.userId !== user.id && normalizeEmail(entry.email) !== email),
      {
        userId: user.id,
        email,
        authProvider: "google",
        googleSubject: payload.googleSubject,
        createdAt: user.createdAt,
      },
    ],
  });

  return {
    state: nextWorkspace,
    auth: nextAuth,
    user,
  };
}

export async function updateLocalWorkspacePassword(authState: LocalAuthState, userId: string, password: string) {
  if (!password.trim()) {
    return authState;
  }

  if (password.length < 8) {
    throw new Error("Use at least 8 characters for the password.");
  }

  return sanitizeLocalAuthState({
    ...authState,
    users: await Promise.all(
      authState.users.map(async (entry) => {
        if (entry.userId !== userId || entry.authProvider !== "password") {
          return entry;
        }

        return {
          ...entry,
          passwordHash: await hashLocalPassword(password),
        };
      }),
    ),
  });
}
