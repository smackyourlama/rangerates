"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";

export function RequireAuth({ next, children }: { next: string; children: React.ReactNode }) {
  const { ready, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !currentUser) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [currentUser, next, ready, router]);

  if (!ready) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/88 p-8 text-sm text-slate-600 shadow-soft">
        Loading your RangeRates workspace…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-900 shadow-soft">
        <div className="font-semibold">You need to sign in to open this page.</div>
        <div className="mt-2">You are being redirected now. If nothing happens, use the button below.</div>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-4 inline-flex rounded-full bg-brand-primary px-5 py-3 font-semibold text-white">
          Go to login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
