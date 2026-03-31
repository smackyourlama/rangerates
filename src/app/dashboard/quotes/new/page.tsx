"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { DashboardShell, Panel } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import type { DeliveryQuote } from "@/types/delivery";
import { formatCurrency } from "@/lib/workspace";

const MapPreview = dynamic(() => import("@/components/map-preview").then((mod) => mod.MapPreview), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-brand-primary/30 text-sm text-brand-muted">
      Loading route preview…
    </div>
  ),
});

export default function NewQuotePage() {
  const router = useRouter();
  const { customers, addQuote } = useApp();
  const [address, setAddress] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [routeType, setRouteType] = useState<"delivery" | "pickup" | "after-hours">("delivery");
  const [urgency, setUrgency] = useState<"same-day" | "today" | "next-day" | "flex">("today");
  const [notes, setNotes] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customerId, customers],
  );

  const summary = useMemo(() => {
    if (!quote) return "";
    const label = selectedCustomer?.name || customerLabel.trim() || "Walk-in customer";
    return `RangeRates ${routeType} quote for ${label}: ${quote.destinationAddress}, ${quote.distanceMiles} miles, ${formatCurrency(quote.price)}.`;
  }, [customerLabel, quote, routeType, selectedCustomer]);

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      if (!address.trim()) {
        throw new Error("Enter a destination address first.");
      }

      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to calculate the quote.");
      }

      setQuote(payload.quote as DeliveryQuote);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to calculate the quote.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSave() {
    if (!quote) {
      setError("Calculate the quote first.");
      return;
    }

    const record = addQuote({
      ...quote,
      customerId: selectedCustomer?.id ?? null,
      customerLabel: selectedCustomer?.name || customerLabel.trim() || "Walk-in customer",
      routeType,
      urgency,
      notes,
      status: "draft",
    });

    router.push(`/dashboard/quotes/${record.id}`);
  }

  return (
    <DashboardShell
      title="Create quote"
      subtitle="Calculate the route, preview the map, then save the quote into the history flow instead of losing it after one reply."
    >
      <RequireAuth next="/dashboard/quotes/new">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Quote inputs" description="This is the creation flow for saved delivery quotes.">
            <form className="space-y-4" onSubmit={handleCalculate}>
              <label className="block text-sm font-medium text-slate-700">
                Existing customer
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="input-base mt-2">
                  <option value="">No linked customer yet</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>

              {!selectedCustomer ? (
                <label className="block text-sm font-medium text-slate-700">
                  Customer label
                  <input
                    value={customerLabel}
                    onChange={(event) => setCustomerLabel(event.target.value)}
                    placeholder="Mac Services customer"
                    className="input-base mt-2"
                  />
                </label>
              ) : null}

              <label className="block text-sm font-medium text-slate-700">
                Destination address
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="100 N Main St, Adrian, MI"
                  className="input-base mt-2"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Route type
                  <select value={routeType} onChange={(event) => setRouteType(event.target.value as typeof routeType)} className="input-base mt-2">
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                    <option value="after-hours">After-hours</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Urgency
                  <select value={urgency} onChange={(event) => setUrgency(event.target.value as typeof urgency)} className="input-base mt-2">
                    <option value="same-day">Same day</option>
                    <option value="today">Today</option>
                    <option value="next-day">Next day</option>
                    <option value="flex">Flexible</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Dispatch notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Gate code, unit number, after-hours note, or follow-up context"
                  className="input-base mt-2 min-h-[120px] resize-y"
                />
              </label>

              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={loading} className="button-primary disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Calculating…" : "Calculate quote"}
                </button>
                <button type="button" onClick={handleSave} className="button-secondary">
                  Save quote
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Quote preview" description="The preview shows the exact output before you save it to the detail page.">
            {quote ? (
              <div className="space-y-5">
                <div className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Destination</span>
                    <span className="text-right font-semibold text-brand-ink">{quote.destinationAddress}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Distance</span>
                    <span className="font-semibold text-brand-ink">{quote.distanceMiles} miles ({quote.distanceSource})</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Tier</span>
                    <span className="font-semibold text-brand-ink">{quote.tierLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Charge</span>
                    <span className="text-2xl font-semibold text-brand-primary">{formatCurrency(quote.price)}</span>
                  </div>
                </div>

                <MapPreview origin={quote.originCoordinates} destination={quote.destinationCoordinates} />

                <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-sm leading-7 text-brand-ink">
                  {summary}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleCopy} className="button-secondary">
                    {copied ? "Copied" : "Copy summary"}
                  </button>
                  <button type="button" onClick={handleSave} className="button-primary">
                    Save and open detail
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-brand-primary/30 bg-brand-primary/5 p-8 text-center">
                <div className="text-lg font-semibold text-brand-ink">Nothing calculated yet</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">Run the address through the calculator, then save the quote so it lands in your history, dashboard, and customer flow.</p>
              </div>
            )}
          </Panel>
        </div>
      </RequireAuth>
    </DashboardShell>
  );
}
