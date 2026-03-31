"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatCurrency, formatDateTime, type CustomerStatus } from "@/lib/workspace";

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const customerId = Array.isArray(params?.customerId) ? params.customerId[0] : params?.customerId;
  const { quotes, getCustomerById, updateCustomer } = useApp();
  const customer = customerId ? getCustomerById(customerId) : undefined;
  const relatedQuotes = customer ? quotes.filter((quote) => quote.customerId === customer.id) : [];

  return (
    <DashboardShell
      title="Customer detail"
      subtitle="Customer pages should combine editing, status management, and related quote history in one place."
      actions={
        <>
          <Link href="/dashboard/customers" className="button-secondary">
            Back to customers
          </Link>
          <Link href="/dashboard/quotes/new" className="button-primary">
            New quote
          </Link>
        </>
      }
    >
      <RequireAuth next={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customers"}>
        {!customer ? (
          <EmptyState
            title="Customer not found"
            description="This customer record is not available in the current browser workspace. Go back to the list and open another record."
            actionHref="/dashboard/customers"
            actionLabel="Back to customer list"
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="space-y-6">
              <Panel title={customer.name} description="Edit the record directly here instead of bouncing to a separate settings page.">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Name
                    <input value={customer.name} onChange={(event) => updateCustomer(customer.id, { name: event.target.value })} className="input-base mt-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Company
                    <input value={customer.company} onChange={(event) => updateCustomer(customer.id, { company: event.target.value })} className="input-base mt-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Phone
                    <input value={customer.phone} onChange={(event) => updateCustomer(customer.id, { phone: event.target.value })} className="input-base mt-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Email
                    <input value={customer.email} onChange={(event) => updateCustomer(customer.id, { email: event.target.value })} className="input-base mt-2" type="email" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Address
                    <input value={customer.address} onChange={(event) => updateCustomer(customer.id, { address: event.target.value })} className="input-base mt-2" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                    <select value={customer.status} onChange={(event) => updateCustomer(customer.id, { status: event.target.value as CustomerStatus })} className="input-base mt-2">
                      <option value="active">Active</option>
                      <option value="priority">Priority</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-sm text-slate-500">Updated</div>
                    <div className="mt-2 font-semibold text-brand-ink">{formatDateTime(customer.updatedAt)}</div>
                    <div className="mt-3"><StatusBadge value={customer.status} /></div>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Notes
                    <textarea value={customer.notes} onChange={(event) => updateCustomer(customer.id, { notes: event.target.value })} rows={6} className="input-base mt-2 min-h-[160px] resize-y" placeholder="Preferred route timing, access details, or service notes" />
                  </label>
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="Related quote history" description="Connected flow matters: customer record to quote history should be one click, not a scavenger hunt.">
                {relatedQuotes.length === 0 ? (
                  <EmptyState
                    title="No linked quotes yet"
                    description="Create the next quote from the quote desk and link it to this customer so the history starts here."
                    actionHref="/dashboard/quotes/new"
                    actionLabel="Create linked quote"
                  />
                ) : (
                  <div className="space-y-3">
                    {relatedQuotes.map((quote) => (
                      <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-brand-ink">{quote.destinationAddress}</div>
                          <StatusBadge value={quote.status} />
                        </div>
                        <div className="mt-2 text-sm text-slate-600">{formatCurrency(quote.price)} · {quote.distanceMiles} miles · {formatDateTime(quote.updatedAt)}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Next actions" description="Every detail page should tell the operator what they can do next.">
                <div className="space-y-3">
                  <Link href="/dashboard/quotes/new" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-sm text-slate-500">Quote desk</div>
                    <div className="mt-1 font-semibold text-brand-ink">Create another quote for {customer.name}</div>
                  </Link>
                  <Link href="/dashboard/customers" className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-brand-primary/5">
                    <div className="text-sm text-slate-500">Customer list</div>
                    <div className="mt-1 font-semibold text-brand-ink">Return to the full customer view</div>
                  </Link>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </RequireAuth>
    </DashboardShell>
  );
}
