import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { readWorkspaceStateFile, writeWorkspaceStateFile } from "@/lib/server/workspace-store";

const DATA_DIR = path.join(process.cwd(), "data");
const ADMIN_FILE = path.join(DATA_DIR, "rangerates-admin.json");
export const ADMIN_COOKIE = "rangerates_admin_session";

export type AdminUser = {
  username: string;
  passwordHash: string;
  requirePasswordChange: boolean;
  activeSessionToken: string | null;
  updatedAt: string;
};

export type AdminSubscription = {
  id: string;
  userId: string;
  email: string;
  planName: string;
  amount: number;
  interval: "monthly" | "yearly";
  status: "trialing" | "active" | "past_due" | "canceled";
  startedAt: string;
  renewsAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export type AdminPlan = {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  active: boolean;
};

export type AdminState = {
  admin: AdminUser;
  twilioDefaults: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  plans: AdminPlan[];
  subscriptions: AdminSubscription[];
};

function nowIso() {
  return new Date().toISOString();
}

function defaultState(): AdminState {
  return {
    admin: {
      username: "admin",
      passwordHash: hashPassword("admin"),
      requirePasswordChange: true,
      activeSessionToken: null,
      updatedAt: nowIso(),
    },
    twilioDefaults: {
      accountSid: "",
      authToken: "",
      fromNumber: "",
    },
    stripe: {
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
    },
    plans: [
      { id: crypto.randomUUID(), name: "Starter", price: 49, interval: "monthly", active: true },
      { id: crypto.randomUUID(), name: "Growth", price: 149, interval: "monthly", active: true },
      { id: crypto.randomUUID(), name: "Pro", price: 399, interval: "monthly", active: true },
    ],
    subscriptions: [],
  };
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [salt, existingHash] = encoded.split(":");
  if (!salt || !existingHash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(existingHash, "hex"), Buffer.from(candidate, "hex"));
}

export async function readAdminStateFile(): Promise<AdminState> {
  try {
    const raw = await readFile(ADMIN_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AdminState>;
    const fallback = defaultState();
    return {
      admin: {
        username: parsed.admin?.username || fallback.admin.username,
        passwordHash: parsed.admin?.passwordHash || fallback.admin.passwordHash,
        requirePasswordChange: parsed.admin?.requirePasswordChange ?? fallback.admin.requirePasswordChange,
        activeSessionToken: parsed.admin?.activeSessionToken ?? null,
        updatedAt: parsed.admin?.updatedAt || fallback.admin.updatedAt,
      },
      twilioDefaults: {
        accountSid: parsed.twilioDefaults?.accountSid || "",
        authToken: parsed.twilioDefaults?.authToken || "",
        fromNumber: parsed.twilioDefaults?.fromNumber || "",
      },
      stripe: {
        publishableKey: parsed.stripe?.publishableKey || "",
        secretKey: parsed.stripe?.secretKey || "",
        webhookSecret: parsed.stripe?.webhookSecret || "",
      },
      plans: Array.isArray(parsed.plans) ? parsed.plans : fallback.plans,
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
    };
  } catch {
    const state = defaultState();
    await writeAdminStateFile(state);
    return state;
  }
}

export async function writeAdminStateFile(state: AdminState): Promise<AdminState> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ADMIN_FILE, JSON.stringify(state, null, 2), "utf-8");
  return state;
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value || "";
  const state = await readAdminStateFile();
  const authenticated = Boolean(token && state.admin.activeSessionToken && token === state.admin.activeSessionToken);
  return {
    authenticated,
    requirePasswordChange: authenticated ? state.admin.requirePasswordChange : false,
    username: authenticated ? state.admin.username : null,
  };
}

export async function authenticateAdmin(username: string, password: string) {
  const state = await readAdminStateFile();
  if (username !== state.admin.username || !verifyPassword(password, state.admin.passwordHash)) {
    return null;
  }
  state.admin.activeSessionToken = crypto.randomUUID();
  state.admin.updatedAt = nowIso();
  await writeAdminStateFile(state);
  return { token: state.admin.activeSessionToken, requirePasswordChange: state.admin.requirePasswordChange };
}

export async function changeAdminPassword(newPassword: string) {
  const state = await readAdminStateFile();
  state.admin.passwordHash = hashPassword(newPassword);
  state.admin.requirePasswordChange = false;
  state.admin.updatedAt = nowIso();
  await writeAdminStateFile(state);
  return state;
}

export async function clearAdminSession() {
  const state = await readAdminStateFile();
  state.admin.activeSessionToken = null;
  state.admin.updatedAt = nowIso();
  await writeAdminStateFile(state);
}

export async function updateAdminSettings(payload: {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
}) {
  const state = await readAdminStateFile();
  state.twilioDefaults = {
    accountSid: payload.twilioAccountSid ?? state.twilioDefaults.accountSid,
    authToken: payload.twilioAuthToken ?? state.twilioDefaults.authToken,
    fromNumber: payload.twilioFromNumber ?? state.twilioDefaults.fromNumber,
  };
  state.stripe = {
    publishableKey: payload.stripePublishableKey ?? state.stripe.publishableKey,
    secretKey: payload.stripeSecretKey ?? state.stripe.secretKey,
    webhookSecret: payload.stripeWebhookSecret ?? state.stripe.webhookSecret,
  };
  await writeAdminStateFile(state);
  return state;
}

export async function createPlan(payload: { name: string; price: number; interval: "monthly" | "yearly" }) {
  const state = await readAdminStateFile();
  state.plans.unshift({ id: crypto.randomUUID(), name: payload.name, price: payload.price, interval: payload.interval, active: true });
  await writeAdminStateFile(state);
  return state;
}

export async function createSubscription(payload: {
  userId: string;
  email: string;
  planName: string;
  amount: number;
  interval: "monthly" | "yearly";
  status: "trialing" | "active" | "past_due" | "canceled";
  renewsAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const state = await readAdminStateFile();
  state.subscriptions.unshift({ id: crypto.randomUUID(), startedAt: nowIso(), ...payload });
  await writeAdminStateFile(state);
  return state;
}

export async function updateSubscription(subscriptionId: string, patch: Partial<AdminSubscription>) {
  const state = await readAdminStateFile();
  state.subscriptions = state.subscriptions.map((subscription) =>
    subscription.id === subscriptionId ? { ...subscription, ...patch } : subscription,
  );
  await writeAdminStateFile(state);
  return state;
}

export async function upsertStripeSubscription(payload: {
  userId: string;
  email: string;
  planName: string;
  amount: number;
  interval: "monthly" | "yearly";
  status: "trialing" | "active" | "past_due" | "canceled";
  renewsAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const state = await readAdminStateFile();
  const existing = state.subscriptions.find((subscription) => subscription.stripeSubscriptionId && subscription.stripeSubscriptionId === payload.stripeSubscriptionId);
  if (existing) {
    state.subscriptions = state.subscriptions.map((subscription) =>
      subscription.id === existing.id ? { ...subscription, ...payload } : subscription,
    );
  } else {
    state.subscriptions.unshift({ id: crypto.randomUUID(), startedAt: nowIso(), ...payload });
  }
  await writeAdminStateFile(state);
  return state;
}

export async function getUserSubscription(userId: string) {
  const state = await readAdminStateFile();
  return state.subscriptions.find((subscription) => subscription.userId === userId && subscription.status !== "canceled") || null;
}

export async function deleteSubscription(subscriptionId: string) {
  const state = await readAdminStateFile();
  state.subscriptions = state.subscriptions.filter((subscription) => subscription.id !== subscriptionId);
  await writeAdminStateFile(state);
  return state;
}

export async function createWorkspaceUser(payload: {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role: "dispatch" | "owner" | "coordinator" | "operations";
}) {
  const workspace = await readWorkspaceStateFile();
  const userId = `user_${crypto.randomUUID()}`;
  workspace.users.push({
    id: userId,
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    companyName: payload.companyName,
    role: payload.role,
    authProvider: "password",
    createdAt: nowIso(),
  });
  workspace.settings.push({ userId, baseLocation: "", twilioAccountSid: "", twilioAuthToken: "", twilioFromNumber: "" });
  await writeWorkspaceStateFile(workspace);
  return workspace;
}

export async function updateWorkspaceUser(userId: string, patch: Record<string, string>) {
  const workspace = await readWorkspaceStateFile();
  workspace.users = workspace.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          fullName: patch.fullName ?? user.fullName,
          email: patch.email ?? user.email,
          companyName: patch.companyName ?? user.companyName,
          role: (patch.role as typeof user.role) ?? user.role,
          password: patch.password || user.password,
        }
      : user,
  );
  await writeWorkspaceStateFile(workspace);
  return workspace;
}

export async function deleteWorkspaceUser(userId: string) {
  const workspace = await readWorkspaceStateFile();
  workspace.users = workspace.users.filter((user) => user.id !== userId);
  workspace.settings = workspace.settings.filter((setting) => setting.userId !== userId);
  workspace.customers = workspace.customers.filter((customer) => customer.userId !== userId);
  workspace.quotes = workspace.quotes.filter((quote) => quote.userId !== userId);
  workspace.messages = workspace.messages.filter((message) => message.userId !== userId);
  await writeWorkspaceStateFile(workspace);
  return workspace;
}

export async function buildAdminSnapshot() {
  const [workspace, admin] = await Promise.all([readWorkspaceStateFile(), readAdminStateFile()]);
  const activeSubscriptions = admin.subscriptions.filter((subscription) => subscription.status === "active");
  const monthlyRevenue = activeSubscriptions.reduce((sum, subscription) => {
    if (subscription.interval === "yearly") {
      return sum + subscription.amount / 12;
    }
    return sum + subscription.amount;
  }, 0);

  return {
    users: workspace.users,
    admin,
    analytics: {
      totalUsers: workspace.users.length,
      totalQuotes: workspace.quotes.length,
      totalMessages: workspace.messages.length,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRevenue: Math.round(monthlyRevenue),
      yearlyRevenue: Math.round(monthlyRevenue * 12),
    },
  };
}
