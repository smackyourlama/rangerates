import { ORIGIN_ADDRESS } from "@/lib/config";
import type { DeliveryQuote } from "@/types/delivery";

export type WorkspaceRole = "dispatch" | "owner" | "coordinator" | "operations";
export type CustomerStatus = "active" | "priority" | "follow-up" | "archived";
export type QuoteStatus = "draft" | "sent" | "approved" | "scheduled" | "archived";
export type RouteType = "delivery" | "pickup" | "after-hours";
export type Urgency = "same-day" | "today" | "next-day" | "flex";

export type WorkspaceUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role: WorkspaceRole;
  createdAt: string;
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
  routeType: RouteType;
  urgency: Urgency;
  status: QuoteStatus;
  notes: string;
  shareSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceState = {
  version: number;
  sessionUserId: string | null;
  users: WorkspaceUser[];
  customers: CustomerRecord[];
  quotes: QuoteRecord[];
};

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role: WorkspaceRole;
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
  routeType: RouteType;
  urgency: Urgency;
  status?: QuoteStatus;
  notes?: string;
};

export const APP_STORAGE_KEY = "rangerates-workspace-v1";

export function createEmptyWorkspaceState(): WorkspaceState {
  return {
    version: 1,
    sessionUserId: null,
    users: [],
    customers: [],
    quotes: [],
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

export function buildQuoteSummary(quote: Pick<QuoteRecord, "destinationAddress" | "distanceMiles" | "tierLabel" | "price" | "routeType">) {
  return `RangeRates ${quote.routeType} quote for ${quote.destinationAddress}: ${quote.distanceMiles} miles from ${ORIGIN_ADDRESS}. ${quote.tierLabel} → ${formatCurrency(quote.price)}.`;
}

export function sortQuotesByNewest(quotes: QuoteRecord[]) {
  return [...quotes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function sortCustomersByNewest(customers: CustomerRecord[]) {
  return [...customers].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return createEmptyWorkspaceState();
  }

  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) {
      return createEmptyWorkspaceState();
    }

    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      version: 1,
      sessionUserId: parsed.sessionUserId ?? null,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
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
