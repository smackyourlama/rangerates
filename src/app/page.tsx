"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { EmptyState, Panel, SiteFrame, StatusBadge } from "@/components/app-shell";
import { PRICING_TIERS } from "@/lib/pricing";
import { ORIGIN_ADDRESS } from "@/lib/config";
import { formatCurrency } from "@/lib/workspace";

const workflowSteps = [
  {
    title: "Open the quote desk",
    body: "Sign in, open the quote desk, and start pricing jobs right away.",
  },
  {
    title: "Calculate, save, and send",
    body: "Calculate the distance, review the route, and save the quote with the job details.",
  },
  {
    title: "Manage customer follow-up",
    body: "Keep customer details, quote history, and updates together for repeat work and follow-up.",
  },
];

const trustSignals = ["Live route miles", "Saved quotes", "Customer history", "Message tracking"];

const faqs = [
  {
    question: "How does RangeRates calculate the delivery fee?",
    answer:
      "RangeRates checks the route distance and matches it to your pricing tiers so dispatch gets the charge right away.",
  },
  {
    question: "Can dispatch save quotes and reopen them later?",
    answer:
      "Yes. Save the quote, reopen it later, and update the status, notes, date, time, and customer details whenever the job changes.",
  },
  {
    question: "Can I send customer updates from RangeRates?",
    answer:
      "Yes. RangeRates keeps quote and appointment messages tied to the customer record so you can track what was sent.",
  },
  {
    question: "What happens if route lookup fails?",
    answer:
      "RangeRates still gives you a usable result so dispatch can review the job and confirm the final charge.",
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
              Delivery pricing
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-brand-ink md:text-6xl">
              Quote faster, save the job, and keep dispatch moving.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              RangeRates helps you price delivery jobs, save quotes, keep customer details together, and move each job from quote to scheduled stop.
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
                    Get started
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

          </div>

          <div className="space-y-6">
            <Panel title="How RangeRates helps" description="Everything here is focused on quoting, tracking, and follow-up.">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm text-slate-500">Quote desk</div>
                  <div className="mt-2 text-xl font-semibold text-brand-ink">Price jobs quickly</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Enter the address, review the route, and see the delivery charge right away.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm text-slate-500">Saved quotes</div>
                  <div className="mt-2 text-xl font-semibold text-brand-ink">Keep work organized</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Save each quote with status, notes, date, time, and customer details.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm text-slate-500">Customers and messages</div>
                  <div className="mt-2 text-xl font-semibold text-brand-ink">Follow up with confidence</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Keep customer records, linked quotes, and appointment updates in one place.</p>
                </div>
              </div>
            </Panel>

            {currentUser ? (
              <Panel title="Current account snapshot" description="A quick view of what is already saved in your account.">
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
          <Panel title="Pricing table" description="Use these tiers to quote delivery jobs quickly and consistently.">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Quotes follow the active delivery tiers shown below and can be confirmed by dispatch when needed.
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

          <Panel title="Route and status flow" description="Move each quote from the first price to the final appointment.">
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
          <Panel title="Common questions" description="Quick answers about quotes, messages, and pricing.">
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
              title="Start using RangeRates"
              description="Create an account to start saving quotes, customer records, and message history."
              actionHref="/signup"
              actionLabel="Create account"
            />
          ) : (
            <Panel title="Why teams keep work in RangeRates" description="Quotes, customers, and updates stay connected.">
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">Save every quote so pricing, notes, and timing stay attached to the job.</div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">Keep customer contact details and quote history together for repeat work.</div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">Track every job with clear quote statuses from draft to scheduled.</div>
              </div>
            </Panel>
          )}
        </section>
      </div>
    </SiteFrame>
  );
}
