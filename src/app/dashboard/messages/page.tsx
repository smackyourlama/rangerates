"use client";

import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import { formatDateTime } from "@/lib/workspace";

export default function MessagesPage() {
  const { messages, customers, quotes } = useApp();

  return (
    <DashboardShell title="Messages" subtitle="See outbound SMS history, delivery state, and the quote or customer each message came from.">
      <RequireAuth next="/dashboard/messages">
        <Panel title={`Message log (${messages.length})`} description="Outbound quote and appointment messages stay visible here.">
          {messages.length === 0 ? (
            <EmptyState
              title="No messages sent yet"
              description="Send a quote or appointment text from a customer record and it will appear here."
              actionHref="/dashboard/customers"
              actionLabel="Open customers"
            />
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const customer = message.customerId ? customers.find((entry) => entry.id === message.customerId) : null;
                const quote = message.quoteId ? quotes.find((entry) => entry.id === message.quoteId) : null;
                return (
                  <div key={message.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-brand-ink">{customer?.name || message.phone}</div>
                        <div className="mt-1 text-sm text-slate-500">{message.phone}</div>
                      </div>
                      <StatusBadge value={message.status} />
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-600">{message.body}</div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.22em] text-brand-muted">
                      <span>{formatDateTime(message.createdAt)}</span>
                      {quote ? <span>Quote linked</span> : null}
                      {message.providerMessageSid ? <span>Twilio SID {message.providerMessageSid}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </RequireAuth>
    </DashboardShell>
  );
}
