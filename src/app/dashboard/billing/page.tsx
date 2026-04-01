"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";

type Plan = { id: string; name: string; price: number; interval: "monthly" | "yearly"; active: boolean };
type Subscription = { id: string; planName: string; amount: number; interval: "monthly" | "yearly"; status: string; renewsAt: string; stripeCustomerId?: string } | null;

export default function BillingPage() {
  const { currentUser } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const plansResponse = await fetch("/api/billing/plans", { cache: "no-store" });
      const plansPayload = await plansResponse.json();
      setPlans(plansPayload?.plans || []);
      setBillingEnabled(Boolean(plansPayload?.billingEnabled));
      if (currentUser?.id) {
        const subscriptionResponse = await fetch("/api/billing/subscription", { cache: "no-store" });
        const subscriptionPayload = await subscriptionResponse.json();
        setSubscription(subscriptionPayload?.subscription || null);
      }
      const url = new URL(window.location.href);
      if (url.searchParams.get("success")) {
        setMessage("Stripe checkout completed. Your billing record will refresh as webhook events arrive.");
      }
      if (url.searchParams.get("canceled")) {
        setError("Stripe checkout was canceled before payment finished.");
      }
    })();
  }, [currentUser?.id]);

  async function startCheckout(planId: string) {
    if (!currentUser) return;
    setBusyPlanId(planId);
    setError(null);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, origin: window.location.origin }),
    });
    const payload = await response.json();
    setBusyPlanId(null);
    if (!response.ok) {
      setError(payload?.error || "Unable to start Stripe checkout.");
      return;
    }
    if (payload?.url) {
      window.location.href = payload.url;
    }
  }

  async function openPortal() {
    if (!currentUser) return;
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: window.location.origin }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Unable to open the billing portal.");
      return;
    }
    if (payload?.url) {
      window.location.href = payload.url;
    }
  }

  return (
    <DashboardShell title="Billing" subtitle="Start subscriptions, track the active plan, and hand off payment changes to Stripe when billing is live.">
      <RequireAuth next="/dashboard/billing">
        <div className="space-y-6">
          {!billingEnabled ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Billing is not live yet. Add the Stripe publishable key, secret key, and webhook secret in <Link href="/admin" className="font-semibold underline">/admin</Link> to enable subscriptions.
            </div>
          ) : null}
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-soft">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Billing status</div>
              <div className="mt-3 text-2xl font-semibold text-brand-ink">{billingEnabled ? "Live" : "Setup needed"}</div>
              <div className="mt-2 text-sm text-slate-600">{billingEnabled ? "Stripe checkout and portal are enabled." : "Add Stripe keys in admin before accepting subscriptions."}</div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-soft">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Current plan</div>
              <div className="mt-3 text-2xl font-semibold text-brand-ink">{subscription?.planName || "No subscription"}</div>
              <div className="mt-2 text-sm text-slate-600">{subscription ? `$${subscription.amount}/${subscription.interval === "yearly" ? "yr" : "mo"}` : "Pick a plan below to start billing."}</div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-soft">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Portal access</div>
              <div className="mt-3 text-2xl font-semibold text-brand-ink">{subscription?.stripeCustomerId ? "Ready" : "Pending"}</div>
              <div className="mt-2 text-sm text-slate-600">{subscription?.stripeCustomerId ? "Manage payment methods and cancel in Stripe." : "Portal activates after a Stripe customer record exists."}</div>
            </div>
          </div>

          <Panel title="Current subscription" description="The active billing record for this workspace user.">
            {!subscription ? (
              <EmptyState title="No active subscription yet" description="Pick a plan below to start the hosted Stripe checkout flow." actionHref="#plans" actionLabel="View plans" />
            ) : (
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="text-sm text-slate-500">Current plan</div>
                  <div className="mt-2 text-2xl font-semibold text-brand-ink">{subscription.planName}</div>
                  <div className="mt-2 text-sm text-slate-600">${subscription.amount}/{subscription.interval === "yearly" ? "yr" : "mo"}</div>
                  <div className="mt-2 text-sm text-slate-500">Renews {new Date(subscription.renewsAt).toLocaleDateString()}</div>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <StatusBadge value={subscription.status} />
                  {subscription.stripeCustomerId ? (
                    <button type="button" onClick={openPortal} className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Manage in Stripe portal
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Subscription plans" description="Pick a plan and Rangerates will redirect into hosted Stripe Checkout.">
            <div id="plans" className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{plan.interval === "yearly" ? "Yearly plan" : "Monthly plan"}</div>
                  <div className="mt-2 text-2xl font-semibold text-brand-ink">{plan.name}</div>
                  <div className="mt-3 text-3xl font-semibold text-brand-primary">${plan.price}</div>
                  <div className="mt-1 text-sm text-slate-500">per {plan.interval === "yearly" ? "year" : "month"}</div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                    Hosted checkout handles payment collection, and the webhook sync updates the local subscription record afterward.
                  </div>
                  <button type="button" onClick={() => startCheckout(plan.id)} disabled={!billingEnabled || busyPlanId === plan.id} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                    {busyPlanId === plan.id ? "Redirecting…" : `Subscribe to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </RequireAuth>
    </DashboardShell>
  );
}
