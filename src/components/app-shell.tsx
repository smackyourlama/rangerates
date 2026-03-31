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
        <div className="text-sm text-slate-500">Dispatch workspace</div>
      </div>
    </Link>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

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
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-2 md:flex">
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
                  Create workspace
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
  return (
    <SiteFrame>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-10">
        <section className="rounded-3xl border border-white/70 bg-white/88 p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.38em] text-brand-muted">Operations workspace</div>
              <h1 className="mt-3 text-3xl font-semibold text-brand-ink md:text-4xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{subtitle}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/quotes">Quotes</NavLink>
          <NavLink href="/dashboard/quotes/new">New quote</NavLink>
          <NavLink href="/dashboard/customers">Customers</NavLink>
          <NavLink href="/dashboard/customers/new">Add customer</NavLink>
          <NavLink href="/dashboard/messages">Messages</NavLink>
          <NavLink href="/dashboard/profile">Settings</NavLink>
        </div>

        {children}
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
    <section className="rounded-3xl border border-white/70 bg-white/88 p-6 shadow-soft">
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
    <div className="rounded-3xl border border-dashed border-brand-primary/30 bg-brand-primary/5 p-8 text-center">
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
