"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function ContactForm({ onCreated }: { onCreated?: () => void }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Contact could not be saved." }));
      setMessage(body.error ?? "Contact could not be saved.");
      return;
    }
    form.reset();
    setMessage("Contact saved.");
    await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    onCreated?.();
  }

  return (
    <form
      className="grid gap-3 rounded-lg border bg-white p-4 shadow-card md:grid-cols-2"
      onSubmit={onSubmit}
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
        Company
        <Input className="mt-1" name="company" />
      </label>
      <label className="text-sm font-medium md:col-span-2">
        Status
        <Select className="mt-1" name="status" defaultValue="LEAD">
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospect</option>
          <option value="CUSTOMER">Customer</option>
        </Select>
      </label>
      <Button type="submit" className="w-full md:col-span-2">
        Save contact
      </Button>
      {message ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 md:col-span-2">
          {message}
        </p>
      ) : null}
    </form>
  );
}
