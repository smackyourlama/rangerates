"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  buildQuoteSummary,
  createEmptyWorkspaceState,
  createId,
  normalizeEmail,
  persistWorkspaceState,
  loadWorkspaceState,
  sortCustomersByNewest,
  sortQuotesByNewest,
  type CustomerInput,
  type CustomerRecord,
  type LoginInput,
  type QuoteInput,
  type QuoteRecord,
  type SignupInput,
  type WorkspaceState,
  type WorkspaceUser,
} from "@/lib/workspace";

type AppContextValue = {
  ready: boolean;
  currentUser: WorkspaceUser | null;
  users: WorkspaceUser[];
  customers: CustomerRecord[];
  quotes: QuoteRecord[];
  signUp: (input: SignupInput) => void;
  login: (input: LoginInput) => void;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<WorkspaceUser, "fullName" | "companyName" | "role" | "password">>) => void;
  addCustomer: (input: CustomerInput) => CustomerRecord;
  updateCustomer: (customerId: string, patch: Partial<Omit<CustomerRecord, "id" | "userId" | "createdAt">>) => void;
  addQuote: (input: QuoteInput) => QuoteRecord;
  updateQuote: (quoteId: string, patch: Partial<Omit<QuoteRecord, "id" | "userId" | "createdAt">>) => void;
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
    setState(loadWorkspaceState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      persistWorkspaceState(state);
    }
  }, [ready, state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.sessionUserId) ?? null,
    [state.sessionUserId, state.users],
  );

  const customers = useMemo(() => {
    if (!currentUser) return [];
    return sortCustomersByNewest(state.customers.filter((customer) => customer.userId === currentUser.id));
  }, [currentUser, state.customers]);

  const quotes = useMemo(() => {
    if (!currentUser) return [];
    return sortQuotesByNewest(state.quotes.filter((quote) => quote.userId === currentUser.id));
  }, [currentUser, state.quotes]);

  const value = useMemo<AppContextValue>(() => ({
    ready,
    currentUser,
    users: state.users,
    customers,
    quotes,
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
          createdAt: new Date().toISOString(),
        };

        return {
          ...previous,
          sessionUserId: user.id,
          users: [...previous.users, user],
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
        status: input.status ?? "draft",
        notes: input.notes?.trim() ?? "",
        shareSummary: buildQuoteSummary({
          destinationAddress: input.destinationAddress,
          distanceMiles: input.distanceMiles,
          tierLabel: input.tierLabel,
          price: input.price,
          routeType: input.routeType,
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
            }),
          };
        }),
      }));
    },
    getCustomerById(customerId) {
      if (!currentUser) return undefined;
      return state.customers.find((customer) => customer.id === customerId && customer.userId === currentUser.id);
    },
    getQuoteById(quoteId) {
      if (!currentUser) return undefined;
      return state.quotes.find((quote) => quote.id === quoteId && quote.userId === currentUser.id);
    },
  }), [currentUser, customers, quotes, ready, state.customers, state.quotes, state.users]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider.");
  }

  return context;
}
