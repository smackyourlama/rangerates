"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatDateTime } from "@/lib/workspace";

export default function CustomersPage() {
  const { customers, quotes } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !query || [customer.name, customer.company, customer.email, customer.phone, customer.notes]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchesStatus = status === "all" || customer.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  return (
    <DashboardShell
      title="Customers"
      subtitle="Customer detail pages now anchor quote history, notes, status updates, and the next dispatch action."
      actions={
        <Link href="/dashboard/customers/new" className="button-primary">
          Add customer
        </Link>
      }
    >
      <RequireAuth next="/dashboard/customers">
        <div className="space-y-6">
          <Panel title="Search and filter" description="List view plus empty states that point to a real next step.">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, company, phone, email, or notes"
                className="input-base"
              />
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-base">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="priority">Priority</option>
                <option value="follow-up">Follow-up</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </Panel>

          <Panel title={`Customer list (${filteredCustomers.length})`} description="Open a customer to edit fields, review related quotes, and archive old records safely.">
            {customers.length === 0 ? (
              <EmptyState
                title="No customers yet"
                description="Create the first customer record so quote history and dispatch notes have a real home."
                actionHref="/dashboard/customers/new"
                actionLabel="Add first customer"
              />
            ) : filteredCustomers.length === 0 ? (
              <EmptyState
                title="No customers match this filter"
                description="Try a different search term or clear the status filter to see the full list again."
                actionHref="/dashboard/customers"
                actionLabel="Reset filters"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCustomers.map((customer) => {
                  const relatedQuotes = quotes.filter((quote) => quote.customerId === customer.id).length;
                  return (
                    <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-brand-primary/30 hover:bg-brand-primary/5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-lg font-semibold text-brand-ink">{customer.name}</div>
                        <StatusBadge value={customer.status} />
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{customer.company || "Independent account"}</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-500">
                        {customer.phone ? <div>{customer.phone}</div> : null}
                        {customer.email ? <div>{customer.email}</div> : null}
                        <div>{relatedQuotes} related quote{relatedQuotes === 1 ? "" : "s"}</div>
                        <div>Updated {formatDateTime(customer.updatedAt)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </RequireAuth>
    </DashboardShell>
  );
}
