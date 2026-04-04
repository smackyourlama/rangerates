"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Logo, SiteFrame } from "@/components/app-shell";
import type { WorkspaceRole } from "@/lib/workspace";

declare global {
  interface Window {
    google?: any;
  }
}

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
  const { ready, currentUser, signUp, login, loginWithGoogle } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("dispatch");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [googleScriptFailed, setGoogleScriptFailed] = useState(false);

  useEffect(() => {
    if (ready && currentUser) {
      router.replace(resolvedNextPath);
    }
  }, [currentUser, ready, resolvedNextPath, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      setGoogleScriptReady(true);
      setGoogleScriptFailed(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleScriptReady || !googleButtonRef.current || !window.google?.accounts?.id) {
      return;
    }

    setGoogleScriptFailed(false);
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: { credential?: string }) => {
        const credential = response.credential?.trim();
        if (!credential) {
          setError("Google sign-in did not return a usable credential.");
          return;
        }

        setLoading(true);
        setError(null);
        try {
          await loginWithGoogle({ credential });
          router.push(resolvedNextPath);
        } catch (googleError) {
          setError(googleError instanceof Error ? googleError.message : "Google sign-in failed.");
        } finally {
          setLoading(false);
        }
      },
    });

    googleButtonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      text: mode === "signup" ? "signup_with" : "signin_with",
      shape: "pill",
      width: 320,
    });
  }, [googleClientId, googleScriptReady, loginWithGoogle, mode, resolvedNextPath, router]);

  const copy = useMemo(() => {
    if (mode === "signup") {
      return {
        title: "Create your RangeRates account",
        subtitle: "Save quotes, manage customers, and keep delivery updates in one place.",
        submitLabel: "Create account",
        swapLabel: "Already have an account? Sign in",
        swapHref: `/login?next=${encodeURIComponent(resolvedNextPath)}`,
      };
    }

    return {
      title: "Sign in to RangeRates",
      subtitle: "Open your quotes, customers, messages, and settings.",
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
        await signUp({ fullName, companyName, email, password, role });
      } else {
        await login({ email, password });
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
      {googleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => {
            setGoogleScriptReady(true);
            setGoogleScriptFailed(false);
          }}
          onError={() => {
            setGoogleScriptFailed(true);
            setError((current) => current || "Google sign-in could not load in this browser. You can still use email and password.");
          }}
        />
      ) : null}
      <div className={`mx-auto flex min-h-[calc(100vh-81px)] items-center px-4 py-10 md:px-8 ${mode === "signup" ? "max-w-6xl" : "max-w-2xl"}`}>
        <div className={`grid w-full gap-8 ${mode === "signup" ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
          {mode === "signup" ? (
            <section className="rounded-3xl border border-white/70 bg-brand-primary p-8 text-white shadow-soft">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <Logo />
              </div>
              <div className="mt-8 space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.38em] text-brand-accent">RangeRates</div>
                  <h1 className="mt-4 text-4xl font-semibold leading-tight">{copy.title}</h1>
                  <p className="mt-4 text-base leading-7 text-white/80">{copy.subtitle}</p>
                </div>
                <div className="space-y-3 text-sm leading-7 text-white/80">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Create quotes and save them for later.</div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Keep customer details and notes tied to each job.</div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Send clear quote and appointment updates from one place.</div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-white/70 bg-white/92 p-8 shadow-soft">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.38em] text-brand-muted">RangeRates</div>
              <h2 className="mt-3 text-3xl font-semibold text-brand-ink">{copy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Sign in to your account or create a new one to start using RangeRates.</p>
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
                      placeholder=""
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
                  placeholder=""
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <div className="relative mt-2">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder=""
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 my-auto h-9 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:bg-slate-100 hover:text-brand-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
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

            {googleClientId ? (
              <>
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-3">
                  <div className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sign in with Google</div>
                  {googleScriptFailed ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Google sign-in could not load. Refresh and try again, or use email and password.
                    </div>
                  ) : (
                    <div ref={googleButtonRef} className="flex min-h-[44px] justify-center" />
                  )}
                </div>
              </>
            ) : null}

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
