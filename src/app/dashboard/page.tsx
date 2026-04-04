"use client";

import Link from "next/link";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatCurrency, formatDateTime } from "@/lib/workspace";

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-soft">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-brand-ink">{value}</div>
      <div className="mt-2 text-sm text-slate-600">{detail}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, quotes, customers, messages } = useApp();

  const sentQuotes = quotes.filter((quote) => quote.status === "sent").length;
  const scheduledQuotes = quotes.filter((quote) => quote.status === "scheduled").length;
  const draftQuotes = quotes.filter((quote) => quote.status === "draft").length;
  const priorityCustomers = customers.filter((customer) => customer.status === "priority").length;
  const followUpCustomers = customers.filter((customer) => customer.status === "follow-up").length;
  const recentQuotes = quotes.slice(0, 5);
  const recentCustomers = customers.slice(0, 6);
  const recentMessages = messages.slice(0, 4);

  return (
    <DashboardShell
      title="Dispatch dashboard"
      subtitle="Track quotes, customers, and messages from one dashboard."
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
          <section className="overflow-hidden rounded-[32px] border border-slate-950/90 bg-slate-950 p-6 text-white shadow-soft md:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/50">Today</div>
                <h2 className="mt-3 text-3xl font-semibold">
                  {currentUser ? `${currentUser.fullName.split(" ")[0]}, here is your dispatch board.` : "Here is your dispatch board."}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                  Review open quotes, follow up with customers, and keep scheduled jobs organized.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">Drafts</div>
                    <div className="mt-2 text-2xl font-semibold">{draftQuotes}</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">Sent quotes</div>
                    <div className="mt-2 text-2xl font-semibold">{sentQuotes}</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">Messages</div>
                    <div className="mt-2 text-2xl font-semibold">{messages.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">Focus now</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold">Quotes waiting on a reply</div>
                    <div className="mt-1 text-white/65">{sentQuotes} quote(s) still need a customer response.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold">Scheduled jobs</div>
                    <div className="mt-1 text-white/65">{scheduledQuotes} scheduled job(s) should have the date, time, and notes confirmed.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold">Customers needing attention</div>
                    <div className="mt-1 text-white/65">{priorityCustomers + followUpCustomers} customer(s) are marked priority or follow-up.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Saved quotes" value={String(quotes.length)} detail="Quotes currently saved in RangeRates." />
            <MetricTile label="Sent, awaiting reply" value={String(sentQuotes)} detail="Quotes that still need a customer response." />
            <MetricTile label="Scheduled jobs" value={String(scheduledQuotes)} detail="Jobs with appointment details already attached." />
            <MetricTile label="Priority accounts" value={String(priorityCustomers)} detail="Customers marked for immediate attention." />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Quote board" description="Open any quote to review details and update status.">
              {recentQuotes.length === 0 ? (
                <EmptyState
                  title="No saved quotes yet"
                  description="Create the first quote to start tracking pricing, status, and follow-up."
                  actionHref="/dashboard/quotes/new"
                  actionLabel="Create first quote"
                />
              ) : (
                <div className="space-y-3">
                  {recentQuotes.map((quote) => (
                    <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="block rounded-[24px] border border-slate-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-primary/30 hover:bg-brand-primary/5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{quote.customerLabel || "Walk-in customer"}</div>
                          <div className="mt-2 text-lg font-semibold text-brand-ink">{quote.destinationAddress}</div>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                            <span>{quote.distanceMiles} mi</span>
                            <span>{formatCurrency(quote.price)}</span>
                            <span>{formatDateTime(quote.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Charge</div>
                            <div className="mt-1 text-lg font-semibold text-brand-ink">{formatCurrency(quote.price)}</div>
                          </div>
                          <StatusBadge value={quote.status} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            <div className="space-y-6">
              <Panel title="Quick actions" description="Jump straight to the next task.">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Link href="/dashboard/quotes/new" className="rounded-[24px] border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Quote desk</div>
                    <div className="mt-2 font-semibold text-brand-ink">Start a new delivery quote</div>
                    <div className="mt-2 text-sm text-slate-600">Create a price, save the quote, and add job details.</div>
                  </Link>
                  <Link href="/dashboard/customers" className="rounded-[24px] border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Customer queue</div>
                    <div className="mt-2 font-semibold text-brand-ink">Review customers and statuses</div>
                    <div className="mt-2 text-sm text-slate-600">Review contact details, notes, and linked quotes.</div>
                  </Link>
                  <Link href="/dashboard/messages" className="rounded-[24px] border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Message logs</div>
                    <div className="mt-2 font-semibold text-brand-ink">Review sent messages</div>
                    <div className="mt-2 text-sm text-slate-600">Check recent quote and appointment messages.</div>
                  </Link>
                  <Link href="/dashboard/profile" className="rounded-[24px] border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Settings</div>
                    <div className="mt-2 font-semibold text-brand-ink">Update account and quote settings</div>
                    <div className="mt-2 text-sm text-slate-600">Update your account details and starting location for quotes.</div>
                  </Link>
                </div>
              </Panel>

              <Panel title="Latest message activity" description="Recent customer texts sent from RangeRates.">
                {recentMessages.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-brand-primary/30 bg-brand-primary/5 p-5 text-sm leading-7 text-slate-600">
                    No messages yet. Send a quote or appointment update and it will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.map((message) => (
                      <div key={message.id} className="rounded-[24px] border border-slate-100 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-brand-ink">{message.phone}</div>
                          <StatusBadge value={message.status} />
                        </div>
                        <div className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">{message.body}</div>
                        <div className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">{formatDateTime(message.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>

          <Panel title="Customer activity" description="Open any customer to review notes and linked quotes.">
            {recentCustomers.length === 0 ? (
              <EmptyState
                title="No customers yet"
                description="Add the first customer so quotes and notes stay tied to the right record."
                actionHref="/dashboard/customers/new"
                actionLabel="Add first customer"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentCustomers.map((customer) => (
                  <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="rounded-[24px] border border-slate-100 bg-white p-5 transition hover:-translate-y-0.5 hover:bg-brand-primary/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-brand-ink">{customer.name}</div>
                      <StatusBadge value={customer.status} />
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{customer.company || "Independent account"}</div>
                    <div className="mt-2 text-sm text-slate-500">{customer.phone || customer.email || "No contact info yet"}</div>
                    <div className="mt-4 text-xs uppercase tracking-[0.24em] text-brand-muted">Updated {formatDateTime(customer.updatedAt)}</div>
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
