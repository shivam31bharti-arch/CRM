"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { CompanySelect } from "@/components/companies/CompanySelect";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
type DuplicateContact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  reasons: Array<"EMAIL" | "PHONE">;
};

export function ContactForm({ onCreated }: { onCreated?: () => void }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [companyId, setCompanyId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();

  async function saveContact(payload: Record<string, unknown>) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 409 && body.code === "DUPLICATE_CONTACT") {
        setDuplicates(body.duplicates ?? []);
        setPendingPayload(payload);
        setMessage("Review the matching contact before creating another record.");
        return;
      }
      if (!response.ok) {
        setMessage(body.error ?? "Contact could not be saved.");
        return;
      }
      formRef.current?.reset();
      setCompanyId("");
      setDuplicates([]);
      setPendingPayload(null);
      setMessage("Contact saved.");
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      onCreated?.();
    } catch {
      setMessage("Contact could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDuplicates([]);
    setPendingPayload(null);
    const payload: Record<string, FormDataEntryValue | null> = Object.fromEntries(
      new FormData(event.currentTarget)
    );
    if (!payload.companyId) payload.companyId = null;
    await saveContact(payload);
  }

  return (
    <form
      ref={formRef}
      className="grid gap-3 rounded-lg border bg-white p-4 shadow-card md:grid-cols-2"
      onSubmit={onSubmit}
      aria-busy={saving}
    >
      <div className="flex items-center gap-3 border-b pb-3 md:col-span-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-primary">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Quick add</h2>
          <p className="text-xs text-slate-500">Capture a relationship without leaving the list.</p>
        </div>
      </div>
      <label className="text-sm font-medium">
        First name
        <Input className="mt-1" name="firstName" required />
      </label>
      <label className="text-sm font-medium">
        Last name
        <Input className="mt-1" name="lastName" required />
      </label>
      <label className="text-sm font-medium md:col-span-2">
        Email
        <Input className="mt-1" name="email" type="email" />
      </label>
      <label className="text-sm font-medium md:col-span-2">
        Phone
        <Input className="mt-1" name="phone" type="tel" />
      </label>
      <div className="md:col-span-2">
        <CompanySelect value={companyId} onChange={setCompanyId} disabled={saving} />
      </div>
      <label className="text-sm font-medium md:col-span-2">
        Status
        <Select className="mt-1" name="status" defaultValue="LEAD">
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospect</option>
          <option value="CUSTOMER">Customer</option>
        </Select>
      </label>
      <Button type="submit" className="w-full md:col-span-2" disabled={saving}>
        {saving ? "Saving…" : "Save contact"}
      </Button>
      {duplicates.length ? (
        <div
          className="rounded-md border border-amber-200 bg-amber-50 p-3 md:col-span-2"
          role="alert"
        >
          <p className="text-sm font-semibold text-amber-950">Possible duplicate</p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {duplicates.map((duplicate) => (
              <li key={duplicate.id} className="rounded border border-amber-200 bg-white/60 p-2">
                <Link
                  href={`/contacts/${duplicate.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2 hover:text-amber-950"
                >
                  {duplicate.firstName} {duplicate.lastName}
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
                <span className="block">
                  {[duplicate.email, duplicate.phone].filter(Boolean).join(" · ") ||
                    "No email or phone available"}
                </span>
                <span className="block">
                  Matched by {duplicate.reasons.join(" and ").toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                pendingPayload && saveContact({ ...pendingPayload, allowDuplicate: true })
              }
              disabled={!pendingPayload || saving}
            >
              Create anyway
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDuplicates([]);
                setPendingPayload(null);
                setMessage("");
              }}
            >
              Review form
            </Button>
          </div>
        </div>
      ) : null}
      {message ? (
        <p
          className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 md:col-span-2"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
