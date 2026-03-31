"use client";

import { FormEvent, useState } from "react";
import { DashboardShell, Panel } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import type { WorkspaceRole } from "@/lib/workspace";

export default function ProfilePage() {
  const { currentUser, updateProfile } = useApp();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;

    const form = new FormData(event.currentTarget);
    updateProfile({
      fullName: String(form.get("fullName") || currentUser.fullName),
      companyName: String(form.get("companyName") || currentUser.companyName),
      role: String(form.get("role") || currentUser.role) as WorkspaceRole,
      password: String(form.get("password") || ""),
    });
    setMessage("Profile updated.");
    setTimeout(() => setMessage(null), 1600);
  }

  return (
    <DashboardShell title="Profile" subtitle="Keep workspace identity editable and explain how auth works in this build instead of leaving account settings blank.">
      <RequireAuth next="/dashboard/profile">
        {!currentUser ? null : (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Panel title="Workspace profile" description="Edit your stored account details here.">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input name="fullName" defaultValue={currentUser.fullName} className="input-base mt-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                  <input value={currentUser.email} disabled className="input-base mt-2 opacity-70" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Company
                  <input name="companyName" defaultValue={currentUser.companyName} className="input-base mt-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Role
                  <select name="role" defaultValue={currentUser.role} className="input-base mt-2">
                    <option value="dispatch">Dispatch lead</option>
                    <option value="owner">Owner / operator</option>
                    <option value="coordinator">Service coordinator</option>
                    <option value="operations">Operations manager</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Replace password
                  <input name="password" type="password" minLength={8} placeholder="Leave blank to keep the current one" className="input-base mt-2" />
                </label>

                {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 md:col-span-2">{message}</div> : null}

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="button-primary">Save profile</button>
                </div>
              </form>
            </Panel>

            <Panel title="Implementation notes" description="Be honest about what exists in the product today.">
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  This build stores auth and app data in browser local storage so the full logged-in website works immediately with zero backend setup.
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Quotes, customers, dashboard widgets, and profile edits all persist on the same device/browser session until cleared.
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  If you want a multi-device production backend next, the app structure is now ready to swap the storage layer for Supabase, Postgres, or another auth/data service.
                </div>
              </div>
            </Panel>
          </div>
        )}
      </RequireAuth>
    </DashboardShell>
  );
}
