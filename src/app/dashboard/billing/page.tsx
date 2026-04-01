"use client";

import { useEffect, useState } from "react";
import { DashboardShell, EmptyState, Panel, StatusBadge } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";

type Plan = { id: string; name: string; price: number; interval: "monthly" | "yearly"; active: boolean };
type Subscription = { id: string; planName: string; amount: number; interval: "monthly" | "yearly"; status: string; renewsAt: string; stripeCustomerId?: string } | null;

const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";

export default function BillingPage() {
  const { currentUser } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const plansResponse = await fetch("/api/billing/plans", { cache: "no-store" });
      const plansPayload = await plansResponse.json();
      setPlans(plansPayload?.plans || []);
      if (currentUser?.id) {
        const subscriptionResponse = await fetch(`/api/billing/subscription?userId=${encodeURIComponent(currentUser.id)}`, { cache: "no-store" });
        const subscriptionPayload = await subscriptionResponse.json();
        setSubscription(subscriptionPayload?.subscription || null);
      }
      const url = new URL(window.location.href);
      if (url.searchParams.get("success")) {
        setMessage("Stripe checkout completed. Subscription state will update after the webhook arrives.");
      }
      if (url.searchParams.get("canceled")) {
        setError("Stripe checkout was canceled.");
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
      body: JSON.stringify({
        planId,
        userId: currentUser.id,
        email: currentUser.email,
        origin: window.location.origin,
      }),
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
      body: JSON.stringify({ userId: currentUser.id, origin: window.location.origin }),
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
    <DashboardShell title="Billing" subtitle="Start subscriptions, view the current plan, and hand off billing management to Stripe.">
      <RequireAuth next="/dashboard/billing">
        <div className="space-y-6">
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}

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

          <Panel title="Subscription plans" description="Pick a plan and the site will redirect you into Stripe Checkout.">
            <div id="plans" className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-soft">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{plan.interval === "yearly" ? "Yearly plan" : "Monthly plan"}</div>
                  <div className="mt-2 text-2xl font-semibold text-brand-ink">{plan.name}</div>
                  <div className="mt-3 text-3xl font-semibold text-brand-primary">${plan.price}</div>
                  <div className="mt-1 text-sm text-slate-500">per {plan.interval === "yearly" ? "year" : "month"}</div>
                  <button type="button" onClick={() => startCheckout(plan.id)} disabled={busyPlanId === plan.id} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
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
