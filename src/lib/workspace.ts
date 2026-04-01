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
  companyName: string;
  role: WorkspaceRole;
  authProvider: WorkspaceAuthProvider;
  googleSubject?: string;
  createdAt: string;
};

export type WorkspaceSettings = {
  userId: string;
  baseLocation: string;
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
  credential: string;
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

export const STORAGE_VERSION = 3;
export const APP_STORAGE_KEY = "rangerates-workspace-v3";

export function createEmptyWorkspaceState(): WorkspaceState {
  return {
    version: STORAGE_VERSION,
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

function sanitizeUser(value: Partial<WorkspaceUser> | null | undefined): WorkspaceUser | null {
  const id = typeof value?.id === "string" ? value.id : "";
  const email = typeof value?.email === "string" ? normalizeEmail(value.email) : "";
  const authProvider = value?.authProvider === "google" ? "google" : "password";
  const role = (["dispatch", "owner", "coordinator", "operations"] as const).includes(value?.role as WorkspaceRole)
    ? (value!.role as WorkspaceRole)
    : "dispatch";

  if (!id || !email) {
    return null;
  }

  return {
    id,
    fullName: typeof value?.fullName === "string" ? value.fullName : "",
    email,
    companyName: typeof value?.companyName === "string" ? value.companyName : "",
    role,
    authProvider,
    googleSubject: typeof value?.googleSubject === "string" && value.googleSubject ? value.googleSubject : undefined,
    createdAt: typeof value?.createdAt === "string" && value.createdAt ? value.createdAt : new Date().toISOString(),
  };
}

function sanitizeSettings(value: Partial<WorkspaceSettings> | null | undefined): WorkspaceSettings | null {
  const userId = typeof value?.userId === "string" ? value.userId : "";
  if (!userId) {
    return null;
  }

  return {
    userId,
    baseLocation: typeof value?.baseLocation === "string" ? value.baseLocation : "",
  };
}

function sanitizeCustomer(value: Partial<CustomerRecord> | null | undefined): CustomerRecord | null {
  const id = typeof value?.id === "string" ? value.id : "";
  const userId = typeof value?.userId === "string" ? value.userId : "";
  if (!id || !userId) {
    return null;
  }

  return {
    id,
    userId,
    name: typeof value?.name === "string" ? value.name : "",
    company: typeof value?.company === "string" ? value.company : "",
    phone: typeof value?.phone === "string" ? value.phone : "",
    email: typeof value?.email === "string" ? value.email : "",
    address: typeof value?.address === "string" ? value.address : "",
    notes: typeof value?.notes === "string" ? value.notes : "",
    status: (["active", "priority", "follow-up", "archived"] as const).includes(value?.status as CustomerStatus)
      ? (value!.status as CustomerStatus)
      : "active",
    createdAt: typeof value?.createdAt === "string" && value.createdAt ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value?.updatedAt === "string" && value.updatedAt ? value.updatedAt : new Date().toISOString(),
  };
}

function sanitizeQuote(value: Partial<QuoteRecord> | null | undefined): QuoteRecord | null {
  const id = typeof value?.id === "string" ? value.id : "";
  const userId = typeof value?.userId === "string" ? value.userId : "";
  if (!id || !userId) {
    return null;
  }

  const routeType = (["delivery", "pickup", "after-hours"] as const).includes(value?.routeType as RouteType)
    ? (value!.routeType as RouteType)
    : "delivery";
  const urgency = (["same-day", "today", "next-day", "flex"] as const).includes(value?.urgency as Urgency)
    ? (value!.urgency as Urgency)
    : "today";
  const status = (["draft", "sent", "approved", "scheduled", "archived"] as const).includes(value?.status as QuoteStatus)
    ? (value!.status as QuoteStatus)
    : "draft";

  const originCoordinates = Array.isArray(value?.originCoordinates) && value.originCoordinates.length === 2
    ? [Number(value.originCoordinates[0] || 0), Number(value.originCoordinates[1] || 0)] as [number, number]
    : [0, 0] as [number, number];
  const destinationCoordinates = Array.isArray(value?.destinationCoordinates) && value.destinationCoordinates.length === 2
    ? [Number(value.destinationCoordinates[0] || 0), Number(value.destinationCoordinates[1] || 0)] as [number, number]
    : [0, 0] as [number, number];

  const quote: QuoteRecord = {
    id,
    userId,
    customerId: typeof value?.customerId === "string" ? value.customerId : null,
    customerLabel: typeof value?.customerLabel === "string" ? value.customerLabel : "Walk-in customer",
    clientPhone: typeof value?.clientPhone === "string" ? value.clientPhone : "",
    appointmentDate: typeof value?.appointmentDate === "string" ? value.appointmentDate : "",
    appointmentTime: typeof value?.appointmentTime === "string" ? value.appointmentTime : "",
    routeType,
    urgency,
    status,
    notes: typeof value?.notes === "string" ? value.notes : "",
    destinationAddress: typeof value?.destinationAddress === "string" ? value.destinationAddress : "",
    originAddress: typeof value?.originAddress === "string" ? value.originAddress : ORIGIN_ADDRESS,
    originCoordinates,
    destinationCoordinates,
    distanceSource: value?.distanceSource === "straight-line" ? "straight-line" : "driving",
    distanceMiles: Number(value?.distanceMiles || 0),
    tierLabel: typeof value?.tierLabel === "string" ? value.tierLabel : "",
    price: Number(value?.price || 0),
    shareSummary: typeof value?.shareSummary === "string" ? value.shareSummary : "",
    createdAt: typeof value?.createdAt === "string" && value.createdAt ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value?.updatedAt === "string" && value.updatedAt ? value.updatedAt : new Date().toISOString(),
  };

  quote.shareSummary = buildQuoteSummary({
    destinationAddress: quote.destinationAddress,
    distanceMiles: quote.distanceMiles,
    tierLabel: quote.tierLabel,
    price: quote.price,
    routeType: quote.routeType,
    originAddress: quote.originAddress,
  });

  return quote;
}

function sanitizeMessage(value: Partial<MessageLogRecord> | null | undefined): MessageLogRecord | null {
  const id = typeof value?.id === "string" ? value.id : "";
  const userId = typeof value?.userId === "string" ? value.userId : "";
  if (!id || !userId) {
    return null;
  }

  return {
    id,
    userId,
    customerId: typeof value?.customerId === "string" ? value.customerId : null,
    quoteId: typeof value?.quoteId === "string" ? value.quoteId : null,
    phone: typeof value?.phone === "string" ? value.phone : "",
    body: typeof value?.body === "string" ? value.body : "",
    provider: "twilio",
    status: (["sent", "failed", "queued"] as const).includes(value?.status as MessageStatus)
      ? (value!.status as MessageStatus)
      : "queued",
    providerMessageSid: typeof value?.providerMessageSid === "string" ? value.providerMessageSid : undefined,
    error: typeof value?.error === "string" ? value.error : undefined,
    createdAt: typeof value?.createdAt === "string" && value.createdAt ? value.createdAt : new Date().toISOString(),
  };
}

export function sanitizeWorkspaceState(parsed: Partial<WorkspaceState> | null | undefined): WorkspaceState {
  return {
    version: STORAGE_VERSION,
    sessionUserId: typeof parsed?.sessionUserId === "string" ? parsed.sessionUserId : null,
    users: Array.isArray(parsed?.users) ? parsed.users.map((value) => sanitizeUser(value)).filter((value): value is WorkspaceUser => Boolean(value)) : [],
    settings: Array.isArray(parsed?.settings) ? parsed.settings.map((value) => sanitizeSettings(value)).filter((value): value is WorkspaceSettings => Boolean(value)) : [],
    customers: Array.isArray(parsed?.customers) ? parsed.customers.map((value) => sanitizeCustomer(value)).filter((value): value is CustomerRecord => Boolean(value)) : [],
    quotes: Array.isArray(parsed?.quotes) ? parsed.quotes.map((value) => sanitizeQuote(value)).filter((value): value is QuoteRecord => Boolean(value)) : [],
    messages: Array.isArray(parsed?.messages) ? parsed.messages.map((value) => sanitizeMessage(value)).filter((value): value is MessageLogRecord => Boolean(value)) : [],
  };
}

export function workspaceStateRecordCount(state: WorkspaceState) {
  return state.users.length + state.settings.length + state.customers.length + state.quotes.length + state.messages.length + (state.sessionUserId ? 1 : 0);
}

export function pickPreferredWorkspaceState(remoteState: Partial<WorkspaceState> | null | undefined, localState: Partial<WorkspaceState> | null | undefined) {
  const remote = sanitizeWorkspaceState(remoteState);
  const local = sanitizeWorkspaceState(localState);
  const remoteCount = workspaceStateRecordCount(remote);
  const localCount = workspaceStateRecordCount(local);

  if (remoteCount === 0 && localCount > 0) {
    return local;
  }

  if (localCount === 0) {
    return remote;
  }

  return remoteCount >= localCount ? remote : local;
}

export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") {
    return createEmptyWorkspaceState();
  }

  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY) || window.localStorage.getItem("rangerates-workspace-v2") || window.localStorage.getItem("rangerates-workspace-v1");
    if (!raw) {
      return createEmptyWorkspaceState();
    }

    return sanitizeWorkspaceState(JSON.parse(raw));
  } catch {
    return createEmptyWorkspaceState();
  }
}

export function persistWorkspaceState(state: WorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(sanitizeWorkspaceState(state)));
}
