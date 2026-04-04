"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useApp } from "@/components/app-provider";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/rangerates-logo.svg" alt="RangeRates" width={152} height={42} priority />
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">RangeRates</div>
        <div className="text-sm text-slate-500">Delivery quoting</div>
      </div>
    </Link>
  );
}

function NavLink({ href, children, variant = "chip" }: { href: string; children: ReactNode; variant?: "chip" | "rail" }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  if (variant === "rail") {
    return (
      <Link
        href={href}
        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          active
            ? "bg-slate-950 text-white shadow-soft"
            : "text-slate-600 hover:bg-slate-100 hover:text-brand-ink"
        }`}
      >
        <span>{children}</span>
        <span className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>Open</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-brand-primary text-white shadow-soft" : "text-slate-600 hover:bg-white hover:text-brand-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  const { currentUser, logout, ready } = useApp();
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-2 lg:flex">
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-brand-ink">
              Home
            </Link>
            {currentUser ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/dashboard/quotes">Quotes</NavLink>
                <NavLink href="/dashboard/customers">Customers</NavLink>
                <NavLink href="/dashboard/messages">Messages</NavLink>
                <NavLink href="/dashboard/profile">Settings</NavLink>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-3">
            {ready && currentUser ? (
              <>
                <div className="hidden text-right md:block">
                  <div className="text-sm font-semibold text-brand-ink">{currentUser.fullName}</div>
                  <div className="text-xs text-slate-500">{currentUser.companyName || currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white">
                  Log in
                </Link>
                <Link href="/signup" className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { currentUser } = useApp();

  return (
    <SiteFrame>
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <section className="rounded-[28px] border border-slate-900/90 bg-slate-950 p-5 text-white shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">RangeRates</div>
                <div className="mt-3 text-2xl font-semibold">{currentUser?.companyName || "RangeRates"}</div>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Manage quotes, customers, messages, and billing from one place.
                </p>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-soft">
                <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Navigation</div>
                <div className="space-y-2">
                  <NavLink href="/dashboard" variant="rail">Dashboard</NavLink>
                  <NavLink href="/dashboard/quotes" variant="rail">Quotes</NavLink>
                  <NavLink href="/dashboard/quotes/new" variant="rail">New quote</NavLink>
                  <NavLink href="/dashboard/customers" variant="rail">Customers</NavLink>
                  <NavLink href="/dashboard/customers/new" variant="rail">Add customer</NavLink>
                  <NavLink href="/dashboard/messages" variant="rail">Messages</NavLink>
                  <NavLink href="/dashboard/billing" variant="rail">Billing</NavLink>
                  <NavLink href="/dashboard/profile" variant="rail">Settings</NavLink>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-soft">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Daily focus</div>
                <div className="mt-3 text-sm font-semibold text-brand-ink">Keep active quotes moving.</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Save each quote, follow up with pending customers, and move approved jobs to scheduled.
                </p>
              </section>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/88 p-6 shadow-soft md:p-8">
              <div className="absolute" />
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.38em] text-brand-muted">RangeRates</div>
                  <h1 className="mt-3 text-3xl font-semibold text-brand-ink md:text-4xl">{title}</h1>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{subtitle}</p>
                </div>
                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </section>

            <div className="flex flex-wrap gap-3 xl:hidden">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/dashboard/quotes">Quotes</NavLink>
              <NavLink href="/dashboard/quotes/new">New quote</NavLink>
              <NavLink href="/dashboard/customers">Customers</NavLink>
              <NavLink href="/dashboard/customers/new">Add customer</NavLink>
              <NavLink href="/dashboard/messages">Messages</NavLink>
              <NavLink href="/dashboard/billing">Billing</NavLink>
              <NavLink href="/dashboard/profile">Settings</NavLink>
            </div>

            {children}
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-soft">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-brand-ink">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-brand-primary/30 bg-brand-primary/5 p-8 text-center">
      <h3 className="text-lg font-semibold text-brand-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      <Link href={actionHref} className="mt-5 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
        {actionLabel}
      </Link>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone = (() => {
    switch (value) {
      case "approved":
      case "active":
      case "sent":
        return "bg-emerald-100 text-emerald-900";
      case "follow-up":
        return "bg-amber-100 text-amber-900";
      case "priority":
      case "scheduled":
        return "bg-sky-100 text-sky-900";
      case "archived":
      case "failed":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-violet-100 text-violet-900";
    }
  })();

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{value}</span>;
}
