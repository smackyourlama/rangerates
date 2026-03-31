"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Logo, SiteFrame } from "@/components/app-shell";
import type { WorkspaceRole } from "@/lib/workspace";

const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: "dispatch", label: "Dispatch lead" },
  { value: "owner", label: "Owner / operator" },
  { value: "coordinator", label: "Service coordinator" },
  { value: "operations", label: "Operations manager" },
];

export function AuthCard({
  mode,
  nextPath,
}: {
  mode: "login" | "signup";
  nextPath?: string;
}) {
  const router = useRouter();
  const resolvedNextPath = nextPath || "/dashboard";
  const { ready, currentUser, signUp, login } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("dispatch");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (ready && currentUser) {
      router.replace(resolvedNextPath);
    }
  }, [currentUser, ready, resolvedNextPath, router]);

  const copy = useMemo(() => {
    if (mode === "signup") {
      return {
        title: "Create the RangeRates workspace",
        subtitle: "Start with login, customer records, saved quotes, and a dispatch dashboard that actually leads somewhere.",
        submitLabel: "Create workspace",
        swapLabel: "Already have an account? Log in",
        swapHref: `/login?next=${encodeURIComponent(resolvedNextPath)}`,
      };
    }

    return {
      title: "Log in to RangeRates",
      subtitle: "Open your quote desk, customer history, and operations dashboard.",
      submitLabel: "Log in",
      swapLabel: "Need an account? Create one",
      swapHref: `/signup?next=${encodeURIComponent(resolvedNextPath)}`,
    };
  }, [mode, resolvedNextPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        signUp({ fullName, companyName, email, password, role });
      } else {
        login({ email, password });
      }

      router.push(resolvedNextPath);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteFrame>
      <div className="mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/70 bg-brand-primary p-8 text-white shadow-soft">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <Logo />
            </div>
            <div className="mt-8 space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.38em] text-brand-accent">Dispatch workflow first</div>
                <h1 className="mt-4 text-4xl font-semibold leading-tight">{copy.title}</h1>
                <p className="mt-4 text-base leading-7 text-white/80">{copy.subtitle}</p>
              </div>
              <div className="space-y-3 text-sm leading-7 text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Save quotes after calculation instead of losing them after one page refresh.</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Keep customer records and route notes connected to each job.</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Give dispatch a dashboard, history view, and next-action flow from the first login.</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/92 p-8 shadow-soft">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.38em] text-brand-muted">Workspace access</div>
              <h2 className="mt-3 text-3xl font-semibold text-brand-ink">{copy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">This version uses a browser-stored workspace account so the full flow works immediately on Vercel with zero backend setup.</p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Full name
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      type="text"
                      placeholder="Nico Rodriguez"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Company name
                    <input
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      type="text"
                      placeholder="Mac Services Dispatch"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Primary role
                    <select
                      value={role}
                      onChange={(event) => setRole(event.target.value as WorkspaceRole)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="dispatch@company.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="At least 8 characters"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  minLength={8}
                  required
                />
              </label>

              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-brand-primary px-4 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Working…" : copy.submitLabel}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-500">
              <Link href="/" className="transition hover:text-brand-ink">
                Back to home
              </Link>
              <Link href={copy.swapHref} className="font-semibold text-brand-primary transition hover:brightness-110">
                {copy.swapLabel}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </SiteFrame>
  );
}
