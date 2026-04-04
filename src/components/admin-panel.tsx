"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Snapshot = {
  users: Array<{ id: string; fullName: string; email: string; companyName: string; role: string }>;
  admin: {
    twilioDefaults: { accountSid: string; authToken: string; fromNumber: string };
    stripe: { publishableKey: string; secretKey: string; webhookSecret: string };
    plans: Array<{ id: string; name: string; price: number; interval: "monthly" | "yearly"; active: boolean }>;
    subscriptions: Array<{ id: string; userId: string; email: string; planName: string; amount: number; interval: "monthly" | "yearly"; status: string; renewsAt: string }>;
  };
  analytics: {
    totalUsers: number;
    totalQuotes: number;
    totalMessages: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
};

type SessionState = {
  authenticated: boolean;
  requirePasswordChange: boolean;
  username: string | null;
  lockoutUntil?: string | null;
};

const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";
const panelClass = "rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-soft";

export function AdminPanel() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const payload = await response.json();
    setSession(payload);
    return payload as SessionState;
  }

  async function refreshSnapshot() {
    const response = await fetch("/api/admin/snapshot", { cache: "no-store" });
    if (!response.ok) {
      setSnapshot(null);
      return;
    }
    const payload = await response.json();
    setSnapshot(payload);
  }

  useEffect(() => {
    (async () => {
      const current = await refreshSession();
      if (current.authenticated) {
        await refreshSnapshot();
      }
      setLoading(false);
    })();
  }, []);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 2400);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Unable to log in.");
      await refreshSession();
      return;
    }
    const current = await refreshSession();
    if (current.authenticated && !current.requirePasswordChange) {
      await refreshSnapshot();
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const response = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Unable to change password.");
      return;
    }
    await refreshSession();
    await refreshSnapshot();
    flash("Admin password updated.");
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSnapshot(null);
    await refreshSession();
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        twilioAccountSid: form.get("twilioAccountSid"),
        twilioAuthToken: form.get("twilioAuthToken"),
        twilioFromNumber: form.get("twilioFromNumber"),
        stripePublishableKey: form.get("stripePublishableKey"),
        stripeSecretKey: form.get("stripeSecretKey"),
        stripeWebhookSecret: form.get("stripeWebhookSecret"),
      }),
    });
    if (response.ok) {
      await refreshSnapshot();
      flash("Admin settings updated.");
    }
  }

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        password: form.get("password"),
        companyName: form.get("companyName"),
        role: form.get("role"),
      }),
    });
    if (response.ok) {
      (event.currentTarget as HTMLFormElement).reset();
      await refreshSnapshot();
      flash("User created.");
    }
  }

  async function updateUser(userId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        companyName: form.get("companyName"),
        role: form.get("role"),
        password: form.get("password"),
      }),
    });
    if (response.ok) {
      await refreshSnapshot();
      flash("User updated.");
    }
  }

  async function deleteUser(userId: string) {
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    await refreshSnapshot();
    flash("User removed.");
  }

  async function addPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "plan", name: form.get("name"), price: Number(form.get("price") || 0), interval: form.get("interval") }),
    });
    if (response.ok) {
      (event.currentTarget as HTMLFormElement).reset();
      await refreshSnapshot();
      flash("Plan added.");
    }
  }

  async function addSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.get("userId"),
        email: form.get("email"),
        planName: form.get("planName"),
        amount: Number(form.get("amount") || 0),
        interval: form.get("interval"),
        status: form.get("status"),
        renewsAt: form.get("renewsAt"),
      }),
    });
    if (response.ok) {
      (event.currentTarget as HTMLFormElement).reset();
      await refreshSnapshot();
      flash("Subscription added.");
    }
  }

  async function updateSubscription(subscriptionId: string, event: FormEvent<HTMLSelectElement>) {
    const status = event.currentTarget.value;
    const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      await refreshSnapshot();
      flash("Subscription updated.");
    }
  }

  async function deleteSubscription(subscriptionId: string) {
    await fetch(`/api/admin/subscriptions/${subscriptionId}`, { method: "DELETE" });
    await refreshSnapshot();
    flash("Subscription removed.");
  }

  if (loading) {
    return <div className="rounded-[28px] border border-white/80 bg-white/90 p-8 shadow-soft">Loading admin panel…</div>;
  }

  if (!session?.authenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/80 bg-white/92 p-8 shadow-soft">
        <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-brand-muted">Admin login</div>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">RangeRates admin panel</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Sign in to manage users, subscriptions, analytics, messaging, and billing settings for RangeRates.</p>
        {session?.lockoutUntil ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Login protection is active until {new Date(session.lockoutUntil).toLocaleString()}.</div> : null}
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input name="username" defaultValue="admin" className={inputClass} autoComplete="username" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input name="password" type="password" className={inputClass} autoComplete="current-password" />
          </label>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}
          <button type="submit" className="inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Sign in to admin
          </button>
        </form>
      </div>
    );
  }

  if (session.requirePasswordChange) {
    return (
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/80 bg-white/92 p-8 shadow-soft">
        <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-brand-muted">First login security</div>
        <h1 className="mt-3 text-3xl font-semibold text-brand-ink">Change the default admin password</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Set a strong password before using the admin console. Use at least 12 characters, one uppercase letter, and one number.</p>
        <form className="mt-6 space-y-4" onSubmit={handlePasswordChange}>
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input name="newPassword" type="password" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input name="confirmPassword" type="password" className={inputClass} />
          </label>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}
          <button type="submit" className="inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Save new password
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-950/90 bg-slate-950 p-6 text-white shadow-soft md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/50">Admin control</div>
            <h1 className="mt-3 text-3xl font-semibold">RangeRates admin console</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">Manage users, monitor product usage, update Twilio and Stripe settings, and control subscription operations from one place.</p>
          </div>
          <button type="button" onClick={handleLogout} className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Sign out
          </button>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          ["Total users", String(snapshot?.analytics.totalUsers || 0)],
          ["Quotes", String(snapshot?.analytics.totalQuotes || 0)],
          ["Messages", String(snapshot?.analytics.totalMessages || 0)],
          ["Active subscriptions", String(snapshot?.analytics.activeSubscriptions || 0)],
          ["MRR", `$${snapshot?.analytics.monthlyRevenue || 0}`],
          ["ARR", `$${snapshot?.analytics.yearlyRevenue || 0}`],
        ].map(([label, value]) => (
          <div key={label} className={panelClass}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-semibold text-brand-ink">{value}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className={panelClass}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-brand-ink">User management</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Add, modify, or delete workspace users from the admin layer.</p>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={addUser}>
              <label className="block text-sm font-medium text-slate-700">Full name<input name="fullName" className={inputClass} /></label>
              <label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" className={inputClass} /></label>
              <label className="block text-sm font-medium text-slate-700">Company<input name="companyName" className={inputClass} /></label>
              <label className="block text-sm font-medium text-slate-700">Role<select name="role" className={inputClass}><option value="dispatch">Dispatch</option><option value="owner">Owner</option><option value="coordinator">Coordinator</option><option value="operations">Operations</option></select></label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">Password<input name="password" type="password" placeholder="Set a temporary password" className={inputClass} /></label>
              <div className="md:col-span-2"><button type="submit" className="inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">Add user</button></div>
            </form>

            <div className="mt-6 space-y-4">
              {snapshot?.users.map((user) => (
                <form key={user.id} className="rounded-[24px] border border-slate-100 bg-white p-4" onSubmit={(event) => updateUser(user.id, event)}>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input name="fullName" defaultValue={user.fullName} className={inputClass} />
                    <input name="email" type="email" defaultValue={user.email} className={inputClass} />
                    <input name="companyName" defaultValue={user.companyName} className={inputClass} />
                    <select name="role" defaultValue={user.role} className={inputClass}><option value="dispatch">Dispatch</option><option value="owner">Owner</option><option value="coordinator">Coordinator</option><option value="operations">Operations</option></select>
                    <input name="password" placeholder="Leave blank to keep password" className={inputClass} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="submit" className="inline-flex rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">Save</button>
                    <button type="button" onClick={() => deleteUser(user.id)} className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100">Delete</button>
                  </div>
                </form>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-brand-ink">Subscriptions</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Manage plans and active customer subscriptions.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <form className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-4" onSubmit={addPlan}>
                <div className="text-sm font-semibold text-brand-ink">Add plan</div>
                <input name="name" placeholder="Growth" className={inputClass} />
                <input name="price" type="number" placeholder="149" className={inputClass} />
                <select name="interval" className={inputClass}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
                <button type="submit" className="inline-flex rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">Save plan</button>
              </form>

              <form className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-4" onSubmit={addSubscription}>
                <div className="text-sm font-semibold text-brand-ink">Add subscription</div>
                <input name="userId" placeholder="User ID" className={inputClass} />
                <input name="email" type="email" placeholder="user@example.com" className={inputClass} />
                <input name="planName" placeholder="Growth" className={inputClass} />
                <input name="amount" type="number" placeholder="149" className={inputClass} />
                <div className="grid gap-3 md:grid-cols-2">
                  <select name="interval" className={inputClass}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
                  <select name="status" className={inputClass}><option value="active">Active</option><option value="trialing">Trialing</option><option value="past_due">Past due</option><option value="canceled">Canceled</option></select>
                </div>
                <input name="renewsAt" type="date" className={inputClass} />
                <button type="submit" className="inline-flex rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">Save subscription</button>
              </form>
            </div>

            <div className="mt-6 space-y-3">
              {snapshot?.admin.subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-[24px] border border-slate-100 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-semibold text-brand-ink">{subscription.email}</div>
                      <div className="mt-1 text-sm text-slate-600">{subscription.planName} · ${subscription.amount}/{subscription.interval === "yearly" ? "yr" : "mo"}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select defaultValue={subscription.status} onChange={(event) => updateSubscription(subscription.id, event)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        <option value="trialing">Trialing</option>
                        <option value="active">Active</option>
                        <option value="past_due">Past due</option>
                        <option value="canceled">Canceled</option>
                      </select>
                      <button type="button" onClick={() => deleteSubscription(subscription.id)} className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <form className={panelClass} onSubmit={saveSettings}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-brand-ink">Global messaging + billing settings</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Store Twilio defaults for outbound user messaging and Stripe keys for subscription billing setup.</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-100 bg-white p-4">
                <div className="text-sm font-semibold text-brand-ink">Twilio defaults</div>
                <label className="mt-4 block text-sm font-medium text-slate-700">Account SID<input name="twilioAccountSid" defaultValue={snapshot?.admin.twilioDefaults.accountSid || ""} className={inputClass} /></label>
                <label className="mt-4 block text-sm font-medium text-slate-700">Auth token<input name="twilioAuthToken" type="password" defaultValue={snapshot?.admin.twilioDefaults.authToken || ""} className={inputClass} /></label>
                <label className="mt-4 block text-sm font-medium text-slate-700">From number<input name="twilioFromNumber" defaultValue={snapshot?.admin.twilioDefaults.fromNumber || ""} className={inputClass} /></label>
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-white p-4">
                <div className="text-sm font-semibold text-brand-ink">Stripe keys</div>
                <label className="mt-4 block text-sm font-medium text-slate-700">Publishable key<input name="stripePublishableKey" defaultValue={snapshot?.admin.stripe.publishableKey || ""} className={inputClass} /></label>
                <label className="mt-4 block text-sm font-medium text-slate-700">Secret key<input name="stripeSecretKey" type="password" defaultValue={snapshot?.admin.stripe.secretKey || ""} className={inputClass} /></label>
                <label className="mt-4 block text-sm font-medium text-slate-700">Webhook secret<input name="stripeWebhookSecret" type="password" defaultValue={snapshot?.admin.stripe.webhookSecret || ""} className={inputClass} /></label>
              </div>
            </div>

            <div className="mt-5"><button type="submit" className="inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">Save admin settings</button></div>
          </form>

          <div className={panelClass}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-brand-ink">Active plans</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Current pricing plans that can be used for subscriptions.</p>
            </div>
            <div className="space-y-3">
              {snapshot?.admin.plans.map((plan) => (
                <div key={plan.id} className="rounded-[24px] border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-brand-ink">{plan.name}</div>
                      <div className="mt-1 text-sm text-slate-600">${plan.price}/{plan.interval === "yearly" ? "yr" : "mo"}</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{plan.active ? "Active" : "Draft"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
