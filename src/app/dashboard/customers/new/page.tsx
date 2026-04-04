"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DashboardShell, Panel } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-guard";
import { useApp } from "@/components/app-provider";
import type { CustomerStatus } from "@/lib/workspace";

export default function NewCustomerPage() {
  const router = useRouter();
  const { addCustomer } = useApp();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("active");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const customer = addCustomer({ name, company, phone, email, address, notes, status });
      router.push(`/dashboard/customers/${customer.id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save customer.");
    }
  }

  return (
    <DashboardShell title="Add customer" subtitle="Add a customer so quotes and notes stay tied to the right account.">
      <RequireAuth next="/dashboard/customers/new">
        <Panel title="Customer form" description="Save contact details for repeat jobs and follow-up.">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Customer name
              <input value={name} onChange={(event) => setName(event.target.value)} className="input-base mt-2" placeholder="Jordan Smith" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Company
              <input value={company} onChange={(event) => setCompany(event.target.value)} className="input-base mt-2" placeholder="Mac Services" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="input-base mt-2" placeholder="(517) 555-0112" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="input-base mt-2" placeholder="customer@example.com" type="email" />
            </label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Address
              <input value={address} onChange={(event) => setAddress(event.target.value)} className="input-base mt-2" placeholder="100 N Main St, Adrian, MI" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as CustomerStatus)} className="input-base mt-2">
                <option value="active">Active</option>
                <option value="priority">Priority</option>
                <option value="follow-up">Follow-up</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="input-base mt-2 min-h-[140px] resize-y" placeholder="Access info, job notes, or preferred contact details" />
            </label>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 md:col-span-2">{error}</div> : null}

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="button-primary">Save customer</button>
            </div>
          </form>
        </Panel>
      </RequireAuth>
    </DashboardShell>
  );
}
