"use client";

import { FormEvent, useState } from "react";
import { DashboardShell, Panel } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import type { WorkspaceRole } from "@/lib/workspace";

export default function ProfilePage() {
  const { currentUser, settings, updateProfile, updateSettings } = useApp();
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;

    const form = new FormData(event.currentTarget);
    await updateProfile({
      fullName: String(form.get("fullName") || currentUser.fullName),
      companyName: String(form.get("companyName") || currentUser.companyName),
      role: String(form.get("role") || currentUser.role) as WorkspaceRole,
      password: String(form.get("password") || ""),
    });

    updateSettings({
      baseLocation: String(form.get("baseLocation") || ""),
    });

    setMessage("Settings updated.");
    setTimeout(() => setMessage(null), 1600);
  }

  return (
    <DashboardShell title="Settings" subtitle="Edit workspace identity and base location without exposing secrets to the browser.">
      <RequireAuth next="/dashboard/profile">
        {!currentUser ? null : (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Panel title="Workspace settings" description="Everything needed to run quoting lives here. Messaging credentials now stay in the server-side admin layer.">
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
                  <input name="companyName" defaultValue={currentUser.companyName} placeholder="" className="input-base mt-2" />
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
                  <input name="password" type="password" minLength={8} placeholder="" className="input-base mt-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Base location for distance calculations
                  <input name="baseLocation" defaultValue={settings?.baseLocation || ""} placeholder="" className="input-base mt-2" />
                </label>

                {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 md:col-span-2">{message}</div> : null}

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="button-primary">Save settings</button>
                </div>
              </form>
            </Panel>

            <Panel title="Security notes" description="What changed in this hardening pass.">
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Workspace data now syncs to a server-side JSON store without exposing password hashes or admin messaging secrets to the browser.
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Google sign-in works when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured, and the credential is verified on the server before login completes.
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Twilio credentials now live only in <span className="font-semibold text-brand-ink">/admin</span>. Regular users can send messages, but they cannot read or overwrite the underlying secrets from the client.
                </div>
              </div>
            </Panel>
          </div>
        )}
      </RequireAuth>
    </DashboardShell>
  );
}
