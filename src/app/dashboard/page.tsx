"use client";

import Link from "next/link";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatCurrency, formatDateTime } from "@/lib/workspace";

export default function DashboardPage() {
  const { currentUser, quotes, customers } = useApp();

  const sentQuotes = quotes.filter((quote) => quote.status === "sent").length;
  const scheduledQuotes = quotes.filter((quote) => quote.status === "scheduled").length;
  const priorityCustomers = customers.filter((customer) => customer.status === "priority").length;
  const recentQuotes = quotes.slice(0, 5);
  const recentCustomers = customers.slice(0, 5);

  return (
    <DashboardShell
      title="Dispatch dashboard"
      subtitle="See what changed, what still needs follow-up, and where to go next without bouncing between disconnected screens."
      actions={
        <>
          <Link href="/dashboard/quotes/new" className="button-primary">
            New quote
          </Link>
          <Link href="/dashboard/customers/new" className="button-secondary">
            Add customer
          </Link>
        </>
      }
    >
      <RequireAuth next="/dashboard">
        <div className="space-y-6">
          <Panel title={`Welcome back${currentUser ? `, ${currentUser.fullName.split(" ")[0]}` : ""}`} description="The first screen should tell dispatch what exists and what needs attention next.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Saved quotes", String(quotes.length)],
                ["Sent, awaiting reply", String(sentQuotes)],
                ["Scheduled jobs", String(scheduledQuotes)],
                ["Priority customers", String(priorityCustomers)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-3 text-3xl font-semibold text-brand-ink">{value}</div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <Panel title="Recent quote activity" description="Open a quote, change its status, copy the summary, or continue the next step.">
              {recentQuotes.length === 0 ? (
                <EmptyState
                  title="No saved quotes yet"
                  description="The calculator is connected to a real save flow now. Create the first quote, then open its detail page to track status and notes."
                  actionHref="/dashboard/quotes/new"
                  actionLabel="Create first quote"
                />
              ) : (
                <div className="space-y-3">
                  {recentQuotes.map((quote) => (
                    <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-brand-primary/30 hover:bg-brand-primary/5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm text-slate-500">{quote.customerLabel || "Walk-in customer"}</div>
                          <div className="mt-1 text-lg font-semibold text-brand-ink">{quote.destinationAddress}</div>
                          <div className="mt-2 text-sm text-slate-600">
                            {quote.distanceMiles} mi · {formatCurrency(quote.price)} · {formatDateTime(quote.updatedAt)}
                          </div>
                        </div>
                        <StatusBadge value={quote.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Next actions" description="Keep the next workflow step visible even when the workspace is empty.">
              <div className="space-y-4">
                <Link href="/dashboard/quotes/new" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                  <div className="text-sm text-slate-500">Quote desk</div>
                  <div className="mt-1 font-semibold text-brand-ink">Calculate and save a new delivery quote</div>
                </Link>
                <Link href="/dashboard/customers" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                  <div className="text-sm text-slate-500">Customers</div>
                  <div className="mt-1 font-semibold text-brand-ink">Open the customer list and update records</div>
                </Link>
                <Link href="/dashboard/profile" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                  <div className="text-sm text-slate-500">Profile</div>
                  <div className="mt-1 font-semibold text-brand-ink">Review workspace details and account settings</div>
                </Link>
              </div>
            </Panel>
          </div>

          <Panel title="Customer activity" description="Recent records stay one click away from quote history and follow-up work.">
            {recentCustomers.length === 0 ? (
              <EmptyState
                title="No customers yet"
                description="Add the first customer so quotes, notes, and route history are tied to a real record instead of floating around in messages."
                actionHref="/dashboard/customers/new"
                actionLabel="Add first customer"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentCustomers.map((customer) => (
                  <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-brand-ink">{customer.name}</div>
                      <StatusBadge value={customer.status} />
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{customer.company || "Independent account"}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.24em] text-brand-muted">Updated {formatDateTime(customer.updatedAt)}</div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </RequireAuth>
    </DashboardShell>
  );
}
