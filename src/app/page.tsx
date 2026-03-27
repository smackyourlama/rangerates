"use client";

import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { PRICING_TIERS } from "@/lib/pricing";
import { ORIGIN_ADDRESS, FALLBACK_NOTE } from "@/lib/config";
import type { DeliveryQuote } from "@/types/delivery";

const initialQuote: DeliveryQuote | null = null;
const MapPreview = dynamic(() => import("@/components/map-preview").then((mod) => mod.MapPreview), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-brand-primary/30 text-sm text-brand-muted">
      Loading map preview…
    </div>
  )
});

const differentiators = [
  {
    title: "Two-source routing",
    body: "OSRM driving distance is primary. If routing fails, RangeRates falls back to a clean straight-line calculation so dispatch is never blocked."
  },
  {
    title: "Ready-to-share notes",
    body: "Every quote produces a copyable summary with distance, tier, and pricing so customer updates stay consistent."
  },
  {
    title: "Audit-friendly tiers",
    body: "Transparent price bands for the first 20 miles, then a premium tier for anything beyond to cover overtime and fuel."
  }
];

const trustSignals = [
  {
    label: "Dispatch origin",
    value: ORIGIN_ADDRESS
  },
  {
    label: "Coverage",
    value: "Southeast Michigan (primary) + Toledo metro"
  },
  {
    label: "Update cadence",
    value: "Routes refresh nightly"
  }
];

const heroPoints = [
  "Built for Mac Services dispatch and quoting workflows.",
  "Combines OpenStreetMap geocoding with RangeRates business logic.",
  "Works on desktop, tablet, or a dispatcher\'s field laptop."
];

export default function HomePage() {
  const [address, setAddress] = useState("");
  const [quote, setQuote] = useState(initialQuote);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySummary = useMemo(() => {
    if (!quote) return "";
    return `RangeRates quote for ${quote.destinationAddress}: ${quote.distanceMiles} miles from ${ORIGIN_ADDRESS}. Tier ${quote.tierLabel} → $${quote.price}.`;
  }, [quote]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setError(null);
    setQuote(null);

    if (!address.trim()) {
      setError("Please enter a delivery address before calculating.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to calculate the delivery fee.");
      }

      setQuote(payload.quote as DeliveryQuote);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "We couldn't complete the calculation. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!copySummary) return;
    await navigator.clipboard.writeText(copySummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="px-4 py-12 text-brand-ink md:px-10 lg:px-16 xl:px-0">
      <section className="mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/90 p-6 shadow-[0_20px_60px_rgba(92,124,250,0.25)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/rangerates-logo.svg" alt="RangeRates" width={180} height={50} priority />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-muted">RangeRates</p>
              <p className="text-base text-brand-muted">Delivery distance intelligence for Mac Services</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm text-brand-muted">
            <span className="rounded-full border border-brand-primary/30 px-4 py-2 font-semibold text-brand-primary">
              Live Pilot
            </span>
            <span className="rounded-full border border-brand-highlight/30 px-4 py-2 font-semibold text-brand-highlight">
              Share-ready quotes
            </span>
          </div>
        </div>

        <header className="rounded-3xl border border-[#dfe3ff] bg-white/80 p-8 shadow-[0_25px_50px_rgba(21,26,50,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-brand-muted">
            RangeRates Delivery Desk
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-brand-ink md:text-5xl">
            Distance-based delivery fees in under five seconds.
          </h1>
          <p className="mt-4 text-lg text-brand-muted">
            Plug in the customer address and RangeRates returns the driving distance, tier, and the exact currency number you can message back. Origin is fixed at
            {" "}
            <span className="font-semibold text-brand-primary">{ORIGIN_ADDRESS}</span>.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-brand-muted md:grid-cols-3">
            {heroPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-[#e8ebff] bg-white/70 px-4 py-3">
                {point}
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-[#dfe3ff] bg-white/90 p-8 shadow-[0_20px_55px_rgba(21,26,50,0.08)] backdrop-blur">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">Request a quote</h2>
              <p className="text-brand-muted">We use OpenStreetMap data plus RangeRates logic.</p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold uppercase tracking-[0.35em] text-brand-muted">
                Delivery address
              </label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="123 N Main St, Ann Arbor, MI"
                className="w-full rounded-2xl border border-[#d7dcff] bg-white px-4 py-3 text-base text-brand-ink outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-brand-primary px-6 py-3 text-lg font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Calculating…" : "Calculate delivery fee"}
              </button>
            </form>
            {error && (
              <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="mt-8 space-y-3 rounded-2xl border border-[#dfe3ff] bg-white/70 p-4 text-sm text-brand-muted">
              <p>Driving distance is primary; RangeRates automatically falls back to straight-line when routing is unavailable.</p>
              <p>{FALLBACK_NOTE}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#dfe3ff] bg-white/90 p-8 shadow-[0_20px_55px_rgba(21,26,50,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Quote output</h2>
              {quote && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-sm font-semibold text-brand-highlight"
                >
                  {copied ? "Copied" : "Copy summary"}
                </button>
              )}
            </div>

            {quote ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-3 rounded-2xl border border-[#edf0ff] bg-white/70 p-4 text-sm text-brand-muted">
                  <div className="flex items-center justify-between">
                    <span>Destination</span>
                    <span className="font-semibold text-brand-ink">{quote.destinationAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Distance ({quote.distanceSource === "driving" ? "driving" : "direct"})</span>
                    <span className="font-semibold text-brand-ink">{quote.distanceMiles} miles</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tier</span>
                    <span className="font-semibold text-brand-ink">{quote.tierLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className="text-brand-muted">Delivery charge</span>
                    <span className="text-3xl text-brand-primary">${quote.price}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-muted">
                    Route preview
                  </p>
                  <MapPreview origin={quote.originCoordinates} destination={quote.destinationCoordinates} />
                </div>

                <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/10 p-4 text-sm text-brand-ink">
                  {copySummary || "Run a calculation to generate a shareable summary."}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-brand-primary/30 text-brand-muted">
                Run a calculation to see the quote, route preview, and summary text.
              </div>
            )}
          </section>
        </div>

        <section className="grid gap-6 md:grid-cols-3">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#e5e8ff] bg-white/80 p-6 shadow-[0_15px_35px_rgba(21,26,50,0.07)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-muted">RangeRates</p>
              <h3 className="mt-3 text-xl font-semibold text-brand-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-brand-muted">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-[#dde1ff] bg-white/90 p-8 shadow-[0_30px_60px_rgba(21,26,50,0.08)]">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold text-brand-ink">Pricing table</h3>
              <p className="mt-2 text-brand-muted">
                Dispatch can recite these tiers verbatim. The amounts already bake in fuel, driver, and admin overhead.
              </p>
              <div className="mt-8 grid gap-4">
                {PRICING_TIERS.map((tier) => (
                  <div key={tier.id} className="rounded-2xl border border-brand-primary/15 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">{tier.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-brand-ink">
                      ${tier.price}
                      {tier.maxMiles ? (
                        <span className="text-base font-normal text-brand-muted"> · up to {tier.maxMiles} mi</span>
                      ) : (
                        <span className="text-base font-normal text-brand-muted"> · 20+ mi</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[#dfe3ff] bg-white/70 p-4">
                <h4 className="text-lg font-semibold text-brand-ink">How RangeRates calculates distance</h4>
                <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                  <li>1. Geocode destination + Tecumseh origin via OpenStreetMap (Nominatim).</li>
                  <li>2. Request OSRM driving distance.</li>
                  <li>3. If the router fails, compute haversine miles.</li>
                  <li>4. Match the distance to the tier matrix above.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-brand-highlight/30 bg-brand-highlight/10 p-4 text-sm text-brand-ink">
                Additional services (stairs, after-hours, oversized freight) should still be layered on manually — but the base fee always comes from this calculator.
              </div>

              <div className="grid gap-3 rounded-2xl border border-[#dfe3ff] bg-white/70 p-4 text-sm text-brand-muted">
                {trustSignals.map((signal) => (
                  <div key={signal.label} className="flex flex-col gap-1 border-b border-dotted border-brand-primary/20 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em]">{signal.label}</span>
                    <span className="text-base font-semibold text-brand-ink">{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
