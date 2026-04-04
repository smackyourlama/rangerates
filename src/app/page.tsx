"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { EmptyState, Panel, SiteFrame, StatusBadge } from "@/components/app-shell";
import { PRICING_TIERS } from "@/lib/pricing";
import { ORIGIN_ADDRESS } from "@/lib/config";
import { formatCurrency } from "@/lib/workspace";

const workflowSteps = [
  {
    title: "Log in and open the dashboard",
    body: "Start from a real workspace where dispatch can immediately see quote activity, customer records, and the next action to take.",
  },
  {
    title: "Calculate, save, and send",
    body: "Run the address through the live quote engine, preview the route, copy the summary, and save the quote so it does not disappear after one call.",
  },
  {
    title: "Keep customers and quote history connected",
    body: "Every customer gets a detail page with notes, status, contact info, and related quotes so dispatch can pick the thread back up later.",
  },
];

const trustSignals = ["Live route miles", "Saved quotes", "Customer history", "Optional Google sign-in"];

const features = [
  "Working login, signup, and optional Google sign-in",
  "Dispatcher dashboard with summary widgets and quick links",
  "Saved quote history with search, filters, and detail pages",
  "Customer records with edit and archive states",
  "Live OpenStreetMap + OSRM quote engine with route preview",
  "Server-backed workspace auth and synced quote/customer data",
];

const faqs = [
  {
    question: "How does RangeRates calculate the delivery fee?",
    answer:
      "The app geocodes the route, checks driving distance through OSRM, falls back to straight-line distance if needed, and matches the result to the active pricing tiers.",
  },
  {
    question: "Can dispatch save quotes and reopen them later?",
    answer:
      "Yes. Quotes are saved into the workspace so your team can reopen the detail page, update status, add notes, and reuse the summary after the first call.",
  },
  {
    question: "Does the app support Google login?",
    answer:
      "Yes, when the deployment has a Google client ID configured. Email/password login works immediately, and Google sign-in can be turned on without redesigning the auth flow.",
  },
  {
    question: "What happens if route lookup fails?",
    answer:
      "The calculator falls back gracefully instead of dead-ending, so dispatch still gets a usable quote path and can confirm the final delivery fee after route review.",
  },
];

export default function HomePage() {
  const { currentUser, quotes, customers } = useApp();

  return (
    <SiteFrame>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8 md:py-10">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-soft md:p-10">
            <div className="inline-flex rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.34em] text-brand-primary">
              Delivery quote workspace
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-brand-ink md:text-6xl">
              Quote faster, save the job, and keep dispatch moving.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              RangeRates turns route-based delivery pricing into a usable dispatch workflow: calculate live fees from <span className="font-semibold text-brand-primary">{ORIGIN_ADDRESS}</span>, save each quote, attach it to the customer, and surface the next step after login.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {currentUser ? (
                <>
                  <Link href="/dashboard" className="button-primary">
                    Open dashboard
                  </Link>
                  <Link href="/dashboard/quotes/new" className="button-secondary">
                    Create a new quote
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="button-primary">
                    Start quoting deliveries
                  </Link>
                  <Link href="/login" className="button-secondary">
                    Log in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {trustSignals.map((signal) => (
                <div key={signal} className="rounded-full border border-brand-primary/10 bg-brand-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">
                  {signal}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Panel title="What ships in the app" description="No fake billing, no dead buttons, no disconnected landing copy.">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm text-slate-500">Login + workspace</div>
                  <div className="mt-2 text-xl font-semibold text-brand-ink">Auth works immediately</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Email/password login works out of the box, and Google sign-in is available when the Google client ID is configured for the deployment.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm text-slate-500">Quote desk</div>
                  <div className="mt-2 text-xl font-semibold text-brand-ink">Calculate → save → open detail</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">The address calculator now leads into a saved quote flow, history list, detail page, copy summary action, and customer linkage.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm text-slate-500">Customer flow</div>
                  <div className="mt-2 text-xl font-semibold text-brand-ink">Records, notes, archive states</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Customer pages are editable and connected to quote history, so there is a real workflow after the first job lands.</p>
                </div>
              </div>
            </Panel>

            {currentUser ? (
              <Panel title="Current workspace snapshot" description="What your current browser workspace already has stored.">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Saved quotes", String(quotes.length)],
                    ["Customers", String(customers.length)],
                    ["Status", currentUser.role],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="text-sm text-slate-500">{label}</div>
                      <div className="mt-2 text-2xl font-semibold text-brand-ink">{value}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-white/70 bg-white/88 p-6 shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">Step {index + 1}</div>
              <h2 className="mt-3 text-xl font-semibold text-brand-ink">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Panel title="Pricing table" description="These are the live tiers used by the calculator and saved quote flow.">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Quotes are based on route distance from <span className="font-semibold text-brand-ink">{ORIGIN_ADDRESS}</span>, then matched to the active delivery tier. Final pricing can still be confirmed by dispatch if access or route details change.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {PRICING_TIERS.map((tier) => (
                  <div key={tier.id} className="rounded-2xl border border-brand-primary/10 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.34em] text-brand-muted">{tier.label}</div>
                    <div className="mt-3 text-3xl font-semibold text-brand-ink">{formatCurrency(tier.price)}</div>
                    <div className="mt-2 text-sm text-slate-500">{tier.maxMiles ? `Applies through ${tier.maxMiles} miles.` : "Applies beyond 20 miles."}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Route and status flow" description="Saved quotes are no longer stuck in limbo after calculation.">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">Draft</div>
                    <div className="mt-1 font-semibold text-brand-ink">Quote is calculated and saved</div>
                  </div>
                  <StatusBadge value="draft" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">Sent</div>
                    <div className="mt-1 font-semibold text-brand-ink">Dispatcher copied and sent the message</div>
                  </div>
                  <StatusBadge value="sent" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">Approved / scheduled</div>
                    <div className="mt-1 font-semibold text-brand-ink">Job is ready for the next ops step</div>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge value="approved" />
                    <StatusBadge value="scheduled" />
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Common questions" description="The basics visitors usually want to know before they create a workspace.">
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 group open:border-brand-primary/20 open:bg-brand-primary/5">
                  <summary className="cursor-pointer list-none text-base font-semibold text-brand-ink">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </Panel>

          {!currentUser ? (
            <EmptyState
              title="Open the actual product"
              description="The quote desk, customer list, and dispatch dashboard are already wired up. Create a workspace and go straight into the logged-in flow."
              actionHref="/signup"
              actionLabel="Start quoting deliveries"
            />
          ) : (
            <Panel title="What improves after login" description="Why the product works better once dispatch is inside the workspace.">
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">Each quote can be saved, reopened, and updated instead of disappearing after the first calculation.</div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">Customer records, notes, and quote history stay attached so the next call starts with context.</div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">Status changes like draft, sent, approved, and scheduled give dispatch a clearer handoff flow.</div>
              </div>
            </Panel>
          )}
        </section>
      </div>
    </SiteFrame>
  );
}
