"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatCurrency, formatDateTime } from "@/lib/workspace";

const MapPreview = dynamic(() => import("@/components/map-preview").then((mod) => mod.MapPreview), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-brand-primary/30 text-sm text-brand-muted">
      Loading route preview…
    </div>
  ),
});

export default function QuoteDetailPage() {
  const params = useParams<{ quoteId: string }>();
  const quoteId = Array.isArray(params?.quoteId) ? params.quoteId[0] : params?.quoteId;
  const { quotes, customers, getQuoteById, updateQuote } = useApp();
  const quote = quoteId ? getQuoteById(quoteId) : undefined;
  const [copied, setCopied] = useState(false);

  const relatedCustomer = useMemo(
    () => (quote?.customerId ? customers.find((customer) => customer.id === quote.customerId) ?? null : null),
    [customers, quote?.customerId],
  );

  async function handleCopy() {
    if (!quote?.shareSummary) return;
    await navigator.clipboard.writeText(quote.shareSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const recentQuotes = quotes.filter((entry) => entry.id !== quote?.id).slice(0, 3);

  return (
    <DashboardShell
      title="Quote detail"
      subtitle="Review the quote, update details, and keep the job moving."
      actions={
        <>
          <Link href="/dashboard/quotes" className="button-secondary">
            Back to quotes
          </Link>
          <Link href="/dashboard/quotes/new" className="button-primary">
            New quote
          </Link>
        </>
      }
    >
      <RequireAuth next={quoteId ? `/dashboard/quotes/${quoteId}` : "/dashboard/quotes"}>
        {!quote ? (
          <EmptyState
            title="Quote not found"
            description="This quote could not be found. Go back to the quote list and open another one."
            actionHref="/dashboard/quotes"
            actionLabel="Back to quote list"
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="space-y-6">
              <Panel title={quote.destinationAddress} description="Review the saved quote details before you update the job.">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-500">Customer</div>
                    <div className="mt-2 text-lg font-semibold text-brand-ink">{quote.customerLabel || "Walk-in customer"}</div>
                    {relatedCustomer ? (
                      <Link href={`/dashboard/customers/${relatedCustomer.id}`} className="mt-3 inline-flex text-sm font-semibold text-brand-primary">
                        Open customer record
                      </Link>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-500">Current status</div>
                    <div className="mt-2"><StatusBadge value={quote.status} /></div>
                    <div className="mt-3 text-sm text-slate-600">Updated {formatDateTime(quote.updatedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-500">Distance</div>
                    <div className="mt-2 text-2xl font-semibold text-brand-ink">{quote.distanceMiles} miles</div>
                    <div className="mt-2 text-sm text-slate-600">{quote.distanceSource} route source · {quote.tierLabel}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-500">Charge</div>
                    <div className="mt-2 text-2xl font-semibold text-brand-primary">{formatCurrency(quote.price)}</div>
                    <div className="mt-2 text-sm text-slate-600">{quote.routeType} · {quote.urgency}</div>
                  </div>
                </div>
              </Panel>

              <Panel title="Edit quote details" description="Update status, schedule details, customer phone number, and notes.">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                    <select value={quote.status} onChange={(event) => updateQuote(quote.id, { status: event.target.value as typeof quote.status })} className="input-base mt-2">
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="approved">Approved</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Urgency
                    <select value={quote.urgency} onChange={(event) => updateQuote(quote.id, { urgency: event.target.value as typeof quote.urgency })} className="input-base mt-2">
                      <option value="same-day">Same day</option>
                      <option value="today">Today</option>
                      <option value="next-day">Next day</option>
                      <option value="flex">Flexible</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Client phone number
                    <input value={quote.clientPhone} onChange={(event) => updateQuote(quote.id, { clientPhone: event.target.value })} className="input-base mt-2" placeholder="" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Route type
                    <select value={quote.routeType} onChange={(event) => updateQuote(quote.id, { routeType: event.target.value as typeof quote.routeType })} className="input-base mt-2">
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                      <option value="after-hours">After-hours</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Appointment date
                    <input value={quote.appointmentDate} onChange={(event) => updateQuote(quote.id, { appointmentDate: event.target.value })} type="date" className="input-base mt-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Appointment time
                    <input value={quote.appointmentTime} onChange={(event) => updateQuote(quote.id, { appointmentTime: event.target.value })} type="time" className="input-base mt-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Notes
                    <textarea value={quote.notes} onChange={(event) => updateQuote(quote.id, { notes: event.target.value })} rows={5} className="input-base mt-2 min-h-[140px] resize-y" placeholder="" />
                  </label>
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="Route preview" description="Review the route and copy the quote summary.">
                <div className="space-y-4">
                  <MapPreview origin={quote.originCoordinates} destination={quote.destinationCoordinates} />
                  <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-sm leading-7 text-brand-ink">
                    {quote.shareSummary}
                  </div>
                  <button type="button" onClick={handleCopy} className="button-secondary w-full">
                    {copied ? "Copied" : "Copy share summary"}
                  </button>
                </div>
              </Panel>

              <Panel title="Next actions" description="Jump to the next step for this quote.">
                <div className="space-y-3">
                  <Link href="/dashboard/messages" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-sm text-slate-500">Messages</div>
                    <div className="mt-1 font-semibold text-brand-ink">Open message logs and review outbound texts</div>
                  </Link>
                  <Link href="/dashboard/quotes" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-sm text-slate-500">Quote list</div>
                    <div className="mt-1 font-semibold text-brand-ink">Return to the filtered quote list</div>
                  </Link>
                  {relatedCustomer ? (
                    <Link href={`/dashboard/customers/${relatedCustomer.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                      <div className="text-sm text-slate-500">Customer record</div>
                      <div className="mt-1 font-semibold text-brand-ink">Open {relatedCustomer.name} and message them from their record</div>
                    </Link>
                  ) : (
                    <Link href="/dashboard/customers/new" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                      <div className="text-sm text-slate-500">Customer flow</div>
                      <div className="mt-1 font-semibold text-brand-ink">Create a customer record for this quote</div>
                    </Link>
                  )}
                </div>
              </Panel>

              <Panel title="Recent quotes" description="Open another saved quote.">
                {recentQuotes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-brand-primary/30 bg-brand-primary/5 p-5 text-sm text-slate-600">This is the only quote saved so far.</div>
                ) : (
                  <div className="space-y-3">
                    {recentQuotes.map((item) => (
                      <Link key={item.id} href={`/dashboard/quotes/${item.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                        <div className="font-semibold text-brand-ink">{item.destinationAddress}</div>
                        <div className="mt-1 text-sm text-slate-600">{item.customerLabel} · {formatCurrency(item.price)}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}
      </RequireAuth>
    </DashboardShell>
  );
}
