"use client";

import { FormEvent, useState } from "react";
import { DashboardShell, Panel } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import type { WorkspaceRole } from "@/lib/workspace";

export default function ProfilePage() {
  const { currentUser, settings, updateProfile, updateSettings } = useApp();
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

    updateSettings({
      baseLocation: String(form.get("baseLocation") || ""),
      twilioAccountSid: String(form.get("twilioAccountSid") || ""),
      twilioAuthToken: String(form.get("twilioAuthToken") || ""),
      twilioFromNumber: String(form.get("twilioFromNumber") || ""),
    });

    setMessage("Settings updated.");
    setTimeout(() => setMessage(null), 1600);
  }

  return (
    <DashboardShell title="Settings" subtitle="Edit workspace identity, base location, and Twilio credentials from one place.">
      <RequireAuth next="/dashboard/profile">
        {!currentUser ? null : (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Panel title="Workspace settings" description="Everything needed to run quoting and texting sits here.">
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
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Twilio Account SID
                  <input name="twilioAccountSid" defaultValue={settings?.twilioAccountSid || ""} placeholder="" className="input-base mt-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Twilio Auth Token
                  <input name="twilioAuthToken" defaultValue={settings?.twilioAuthToken || ""} placeholder="" className="input-base mt-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                  Twilio From Number
                  <input name="twilioFromNumber" defaultValue={settings?.twilioFromNumber || ""} placeholder="" className="input-base mt-2" />
                </label>

                {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 md:col-span-2">{message}</div> : null}

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" className="button-primary">Save settings</button>
                </div>
              </form>
            </Panel>

            <Panel title="Implementation notes" description="This build now keeps a browser backup, but the source of truth is a server-side workspace file.">
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Workspace data now syncs to a server-side JSON store so customers, quotes, settings, and message history survive browser refreshes and restarts more cleanly than browser-only storage.
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Google sign-in works when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured for the app.
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  Twilio credentials are still visible to the signed-in client in this build, so a production rollout should move auth and secret handling into a dedicated backend with proper access control.
                </div>
              </div>
            </Panel>
          </div>
        )}
      </RequireAuth>
    </DashboardShell>
  );
}
