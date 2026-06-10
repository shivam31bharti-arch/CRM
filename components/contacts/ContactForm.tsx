// Contact create/edit form with client-side validation affordances.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function ContactForm({ onCreated }: { onCreated?: () => void }) {
  const [message, setMessage] = useState("");
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Contact could not be saved." }));
      setMessage(body.error ?? "Contact could not be saved.");
      return;
    }
    form.reset();
    setMessage("Contact saved.");
    onCreated?.();
  }

  return (
    <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2" onSubmit={onSubmit}>
      <label className="text-sm font-medium">
        First name
        <Input className="mt-1" name="firstName" required />
      </label>
      <label className="text-sm font-medium">
        Last name
        <Input className="mt-1" name="lastName" required />
      </label>
      <label className="text-sm font-medium">
        Email
        <Input className="mt-1" name="email" type="email" />
      </label>
      <label className="text-sm font-medium">
        Company
        <Input className="mt-1" name="company" />
      </label>
      <label className="text-sm font-medium">
        Status
        <Select className="mt-1" name="status" defaultValue="LEAD">
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospect</option>
          <option value="CUSTOMER">Customer</option>
        </Select>
      </label>
      <div className="flex items-end">
        <Button type="submit">Save contact</Button>
      </div>
      {message ? <p className="text-sm font-medium text-slate-600 md:col-span-2">{message}</p> : null}
    </form>
  );
}
