"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatCurrency, formatDateTime } from "@/lib/workspace";

export default function QuotesPage() {
  const { quotes } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesSearch = !query || [quote.destinationAddress, quote.customerLabel, quote.notes, quote.routeType]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchesStatus = status === "all" || quote.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, status]);

  return (
    <DashboardShell
      title="Saved quotes"
      subtitle="Search every saved quote, filter by status, and open the detail page to continue the workflow instead of recalculating from scratch."
      actions={
        <Link href="/dashboard/quotes/new" className="button-primary">
          New quote
        </Link>
      }
    >
      <RequireAuth next="/dashboard/quotes">
        <div className="space-y-6">
          <Panel title="Search and filter" description="List view, filters, and a clear next action when nothing is here yet.">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by customer, address, notes, or route type"
                className="input-base"
              />
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-base">
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </Panel>

          <Panel title={`Quote list (${filteredQuotes.length})`} description="Every row leads to a real detail page with status changes, notes, route preview, and copy actions.">
            {quotes.length === 0 ? (
              <EmptyState
                title="No quotes saved yet"
                description="Start with the quote desk. Calculate a destination, save it, then manage it like a real dispatch record."
                actionHref="/dashboard/quotes/new"
                actionLabel="Create first quote"
              />
            ) : filteredQuotes.length === 0 ? (
              <EmptyState
                title="No quotes match this filter"
                description="Try a different status or search term. The list is live-filtered so you can quickly find a customer or route."
                actionHref="/dashboard/quotes"
                actionLabel="Reset filters"
              />
            ) : (
              <div className="space-y-3">
                {filteredQuotes.map((quote) => (
                  <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-brand-primary/30 hover:bg-brand-primary/5">
                    <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.5fr] lg:items-center">
                      <div>
                        <div className="text-sm text-slate-500">{quote.customerLabel || "Walk-in customer"}</div>
                        <div className="mt-1 text-lg font-semibold text-brand-ink">{quote.destinationAddress}</div>
                        <div className="mt-2 text-sm text-slate-600">{quote.routeType} · {quote.urgency} · {quote.distanceMiles} miles</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Quote value</div>
                        <div className="mt-1 text-xl font-semibold text-brand-ink">{formatCurrency(quote.price)}</div>
                        <div className="mt-2 text-sm text-slate-600">Updated {formatDateTime(quote.updatedAt)}</div>
                      </div>
                      <div className="flex items-center justify-start lg:justify-end">
                        <StatusBadge value={quote.status} />
                      </div>
                    </div>
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
