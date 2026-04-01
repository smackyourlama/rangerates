"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  buildQuoteSummary,
  createDefaultSettings,
  createEmptyWorkspaceState,
  createId,
  normalizeEmail,
  persistWorkspaceState,
  loadWorkspaceState,
  pickPreferredWorkspaceState,
  sanitizeWorkspaceState,
  sortCustomersByNewest,
  sortMessagesByNewest,
  sortQuotesByNewest,
  type CustomerInput,
  type CustomerRecord,
  type GoogleLoginInput,
  type LoginInput,
  type MessageLogInput,
  type MessageLogRecord,
  type QuoteInput,
  type QuoteRecord,
  type SignupInput,
  type WorkspaceSettings,
  type WorkspaceState,
  type WorkspaceUser,
} from "@/lib/workspace";

type AppContextValue = {
  ready: boolean;
  currentUser: WorkspaceUser | null;
  settings: WorkspaceSettings | null;
  users: WorkspaceUser[];
  customers: CustomerRecord[];
  quotes: QuoteRecord[];
  messages: MessageLogRecord[];
  signUp: (input: SignupInput) => void;
  login: (input: LoginInput) => void;
  loginWithGoogle: (input: GoogleLoginInput) => void;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<WorkspaceUser, "fullName" | "companyName" | "role" | "password">>) => void;
  updateSettings: (patch: Partial<Omit<WorkspaceSettings, "userId">>) => void;
  addCustomer: (input: CustomerInput) => CustomerRecord;
  updateCustomer: (customerId: string, patch: Partial<Omit<CustomerRecord, "id" | "userId" | "createdAt">>) => void;
  addQuote: (input: QuoteInput) => QuoteRecord;
  updateQuote: (quoteId: string, patch: Partial<Omit<QuoteRecord, "id" | "userId" | "createdAt">>) => void;
  addMessageLog: (input: MessageLogInput) => MessageLogRecord;
  getCustomerById: (customerId: string) => CustomerRecord | undefined;
  getQuoteById: (quoteId: string) => QuoteRecord | undefined;
};

const AppContext = createContext<AppContextValue | null>(null);

function assertUser(user: WorkspaceUser | null): asserts user is WorkspaceUser {
  if (!user) {
    throw new Error("You need to sign in first.");
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(createEmptyWorkspaceState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateWorkspace() {
      const localState = loadWorkspaceState();

      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load server workspace.");
        }

        const payload = await response.json();
        const nextState = pickPreferredWorkspaceState(payload?.state, localState);

        if (!cancelled) {
          setState(nextState);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setState(localState);
          setReady(true);
        }
      }
    }

    hydrateWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    persistWorkspaceState(state);
  }, [ready, state]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: sanitizeWorkspaceState(state) }),
          signal: controller.signal,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Unable to sync workspace state", error);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [ready, state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.sessionUserId) ?? null,
    [state.sessionUserId, state.users],
  );

  const settings = useMemo(() => {
    if (!currentUser) return null;
    return state.settings.find((entry) => entry.userId === currentUser.id) ?? createDefaultSettings(currentUser.id);
  }, [currentUser, state.settings]);

  const customers = useMemo(() => {
    if (!currentUser) return [];
    return sortCustomersByNewest(state.customers.filter((customer) => customer.userId === currentUser.id));
  }, [currentUser, state.customers]);

  const quotes = useMemo(() => {
    if (!currentUser) return [];
    return sortQuotesByNewest(state.quotes.filter((quote) => quote.userId === currentUser.id));
  }, [currentUser, state.quotes]);

  const messages = useMemo(() => {
    if (!currentUser) return [];
    return sortMessagesByNewest(state.messages.filter((message) => message.userId === currentUser.id));
  }, [currentUser, state.messages]);

  const value = useMemo<AppContextValue>(() => ({
    ready,
    currentUser,
    settings,
    users: state.users,
    customers,
    quotes,
    messages,
    signUp(input) {
      const email = normalizeEmail(input.email);
      const fullName = input.fullName.trim();
      const companyName = input.companyName.trim();
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

      setState((previous) => {
        if (previous.users.some((user) => normalizeEmail(user.email) === email)) {
          throw new Error("That email already has an account. Log in instead.");
        }

        const user: WorkspaceUser = {
          id: createId("user"),
          fullName,
          email,
          password,
          companyName,
          role: input.role,
          authProvider: "password",
          createdAt: new Date().toISOString(),
        };

        return {
          ...previous,
          sessionUserId: user.id,
          users: [...previous.users, user],
          settings: [...previous.settings, createDefaultSettings(user.id)],
        };
      });
    },
    login(input) {
      const email = normalizeEmail(input.email);

      setState((previous) => {
        const user = previous.users.find(
          (entry) => normalizeEmail(entry.email) === email && entry.password === input.password,
        );

        if (!user) {
          throw new Error("Email or password is incorrect.");
        }

        return {
          ...previous,
          sessionUserId: user.id,
        };
      });
    },
    loginWithGoogle(input) {
      const email = normalizeEmail(input.email);

      setState((previous) => {
        const existing = previous.users.find(
          (entry) => entry.googleSubject === input.googleSubject || normalizeEmail(entry.email) === email,
        );

        if (existing) {
          return {
            ...previous,
            sessionUserId: existing.id,
            users: previous.users.map((user) =>
              user.id === existing.id
                ? { ...user, fullName: input.fullName || user.fullName, email, googleSubject: input.googleSubject, authProvider: "google" }
                : user,
            ),
          };
        }

        const user: WorkspaceUser = {
          id: createId("user"),
          fullName: input.fullName || "Google user",
          email,
          password: "",
          companyName: "",
          role: "dispatch",
          authProvider: "google",
          googleSubject: input.googleSubject,
          createdAt: new Date().toISOString(),
        };

        return {
          ...previous,
          sessionUserId: user.id,
          users: [...previous.users, user],
          settings: [...previous.settings, createDefaultSettings(user.id)],
        };
      });
    },
    logout() {
      setState((previous) => ({
        ...previous,
        sessionUserId: null,
      }));
    },
    updateProfile(patch) {
      assertUser(currentUser);

      setState((previous) => ({
        ...previous,
        users: previous.users.map((user) => {
          if (user.id !== currentUser.id) return user;

          return {
            ...user,
            fullName: patch.fullName?.trim() || user.fullName,
            companyName: typeof patch.companyName === "string" ? patch.companyName.trim() : user.companyName,
            role: patch.role ?? user.role,
            password: patch.password?.trim() ? patch.password : user.password,
          };
        }),
      }));
    },
    updateSettings(patch) {
      assertUser(currentUser);
      setState((previous) => {
        const existing = previous.settings.find((entry) => entry.userId === currentUser.id) ?? createDefaultSettings(currentUser.id);
        const next = {
          ...existing,
          ...patch,
        };
        const withoutCurrent = previous.settings.filter((entry) => entry.userId !== currentUser.id);
        return {
          ...previous,
          settings: [...withoutCurrent, next],
        };
      });
    },
    addCustomer(input) {
      assertUser(currentUser);

      const customer: CustomerRecord = {
        id: createId("customer"),
        userId: currentUser.id,
        name: input.name.trim(),
        company: input.company?.trim() ?? "",
        phone: input.phone?.trim() ?? "",
        email: input.email?.trim() ?? "",
        address: input.address?.trim() ?? "",
        notes: input.notes?.trim() ?? "",
        status: input.status ?? "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!customer.name) {
        throw new Error("Customer name is required.");
      }

      setState((previous) => ({
        ...previous,
        customers: [...previous.customers, customer],
      }));

      return customer;
    },
    updateCustomer(customerId, patch) {
      assertUser(currentUser);

      setState((previous) => ({
        ...previous,
        customers: previous.customers.map((customer) => {
          if (customer.id !== customerId || customer.userId !== currentUser.id) {
            return customer;
          }

          return {
            ...customer,
            ...patch,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
    },
    addQuote(input) {
      assertUser(currentUser);

      const customer = input.customerId
        ? state.customers.find((entry) => entry.id === input.customerId && entry.userId === currentUser.id)
        : undefined;

      const quote: QuoteRecord = {
        ...input,
        id: createId("quote"),
        userId: currentUser.id,
        customerId: customer?.id ?? null,
        customerLabel: customer?.name ?? input.customerLabel?.trim() ?? "Walk-in customer",
        clientPhone: input.clientPhone?.trim() || customer?.phone || "",
        appointmentDate: input.appointmentDate?.trim() ?? "",
        appointmentTime: input.appointmentTime?.trim() ?? "",
        status: input.status ?? "draft",
        notes: input.notes?.trim() ?? "",
        shareSummary: buildQuoteSummary({
          destinationAddress: input.destinationAddress,
          distanceMiles: input.distanceMiles,
          tierLabel: input.tierLabel,
          price: input.price,
          routeType: input.routeType,
          originAddress: input.originAddress,
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setState((previous) => ({
        ...previous,
        quotes: [...previous.quotes, quote],
      }));

      return quote;
    },
    updateQuote(quoteId, patch) {
      assertUser(currentUser);

      setState((previous) => ({
        ...previous,
        quotes: previous.quotes.map((quote) => {
          if (quote.id !== quoteId || quote.userId !== currentUser.id) {
            return quote;
          }

          const nextQuote = {
            ...quote,
            ...patch,
            updatedAt: new Date().toISOString(),
          };

          return {
            ...nextQuote,
            shareSummary: buildQuoteSummary({
              destinationAddress: nextQuote.destinationAddress,
              distanceMiles: nextQuote.distanceMiles,
              tierLabel: nextQuote.tierLabel,
              price: nextQuote.price,
              routeType: nextQuote.routeType,
              originAddress: nextQuote.originAddress,
            }),
          };
        }),
      }));
    },
    addMessageLog(input) {
      assertUser(currentUser);
      const message: MessageLogRecord = {
        id: createId("msg"),
        userId: currentUser.id,
        customerId: input.customerId ?? null,
        quoteId: input.quoteId ?? null,
        phone: input.phone,
        body: input.body,
        provider: input.provider,
        status: input.status,
        providerMessageSid: input.providerMessageSid,
        error: input.error,
        createdAt: new Date().toISOString(),
      };
      setState((previous) => ({
        ...previous,
        messages: [message, ...previous.messages],
      }));
      return message;
    },
    getCustomerById(customerId) {
      if (!currentUser) return undefined;
      return state.customers.find((customer) => customer.id === customerId && customer.userId === currentUser.id);
    },
    getQuoteById(quoteId) {
      if (!currentUser) return undefined;
      return state.quotes.find((quote) => quote.id === quoteId && quote.userId === currentUser.id);
    },
  }), [currentUser, customers, messages, quotes, ready, settings, state.customers, state.quotes, state.users]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider.");
  }

  return context;
}
