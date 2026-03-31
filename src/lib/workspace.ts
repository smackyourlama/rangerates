import { ORIGIN_ADDRESS } from "@/lib/config";
import type { DeliveryQuote } from "@/types/delivery";

export type WorkspaceRole = "dispatch" | "owner" | "coordinator" | "operations";
export type WorkspaceAuthProvider = "password" | "google";
export type CustomerStatus = "active" | "priority" | "follow-up" | "archived";
export type QuoteStatus = "draft" | "sent" | "approved" | "scheduled" | "archived";
export type RouteType = "delivery" | "pickup" | "after-hours";
export type Urgency = "same-day" | "today" | "next-day" | "flex";
export type MessageStatus = "sent" | "failed" | "queued";

export type WorkspaceUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role: WorkspaceRole;
  authProvider: WorkspaceAuthProvider;
  googleSubject?: string;
  createdAt: string;
};

export type WorkspaceSettings = {
  userId: string;
  baseLocation: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
};

export type CustomerRecord = {
  id: string;
  userId: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
};

export type QuoteRecord = DeliveryQuote & {
  id: string;
  userId: string;
  customerId: string | null;
  customerLabel: string;
  clientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  routeType: RouteType;
  urgency: Urgency;
  status: QuoteStatus;
  notes: string;
  shareSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageLogRecord = {
  id: string;
  userId: string;
  customerId: string | null;
  quoteId: string | null;
  phone: string;
  body: string;
  provider: "twilio";
  status: MessageStatus;
  providerMessageSid?: string;
  error?: string;
  createdAt: string;
};

export type WorkspaceState = {
  version: number;
  sessionUserId: string | null;
  users: WorkspaceUser[];
  settings: WorkspaceSettings[];
  customers: CustomerRecord[];
  quotes: QuoteRecord[];
  messages: MessageLogRecord[];
};

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role: WorkspaceRole;
};

export type GoogleLoginInput = {
  fullName: string;
  email: string;
  googleSubject: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type CustomerInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: CustomerStatus;
};

export type QuoteInput = DeliveryQuote & {
  customerId?: string | null;
  customerLabel?: string;
  clientPhone?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  routeType: RouteType;
  urgency: Urgency;
  status?: QuoteStatus;
  notes?: string;
};

export type MessageLogInput = {
  customerId?: string | null;
  quoteId?: string | null;
  phone: string;
  body: string;
  provider: "twilio";
  status: MessageStatus;
  providerMessageSid?: string;
  error?: string;
};

export const APP_STORAGE_KEY = "rangerates-workspace-v2";

export function createEmptyWorkspaceState(): WorkspaceState {
  return {
    version: 2,
    sessionUserId: null,
    users: [],
    settings: [],
    customers: [],
    quotes: [],
    messages: [],
  };
}

export function createDefaultSettings(userId: string): WorkspaceSettings {
  return {
    userId,
    baseLocation: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioFromNumber: "",
  };
}

export function createId(prefix: string) {
  const globalCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return `${prefix}_${globalCrypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildQuoteSummary(
  quote: Pick<QuoteRecord, "destinationAddress" | "distanceMiles" | "tierLabel" | "price" | "routeType" | "originAddress">,
) {
  const origin = quote.originAddress || ORIGIN_ADDRESS;
  return `RangeRates ${quote.routeType} quote for ${quote.destinationAddress}: ${quote.distanceMiles} miles from ${origin}. ${quote.tierLabel} → ${formatCurrency(quote.price)}.`;
}

export function buildQuoteTextMessage(
  companyName: string,
  customerName: string,
  quote: Pick<QuoteRecord, "appointmentDate" | "appointmentTime" | "destinationAddress" | "routeType">,
) {
  const intro = companyName || "RangeRates";
  const date = quote.appointmentDate || "your scheduled date";
  const time = quote.appointmentTime || "your scheduled time";
  const name = customerName || "there";
  return `Hi ${name}, this is ${intro}. Your ${quote.routeType} appointment is scheduled for ${date} at ${time} for ${quote.destinationAddress}. Reply if you need anything before then.`;
}

export function sortQuotesByNewest(quotes: QuoteRecord[]) {
  return [...quotes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function sortCustomersByNewest(customers: CustomerRecord[]) {
  return [...customers].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function sortMessagesByNewest(messages: MessageLogRecord[]) {
  return [...messages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return createEmptyWorkspaceState();
  }

  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY) || window.localStorage.getItem("rangerates-workspace-v1");
    if (!raw) {
      return createEmptyWorkspaceState();
    }

    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      version: 2,
      sessionUserId: parsed.sessionUserId ?? null,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      settings: Array.isArray(parsed.settings) ? parsed.settings : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return createEmptyWorkspaceState();
  }
}

export function persistWorkspaceState(state: WorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}
