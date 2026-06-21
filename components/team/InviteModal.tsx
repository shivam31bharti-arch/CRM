"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function InviteModal({ onInvited }: { onInvited?: () => void }) {
  const [message, setMessage] = useState("");
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    setMessage(response.ok ? "Teammate added." : "Invite could not be completed.");
    if (response.ok) {
      form.reset();
      onInvited?.();
    }
  }
  return (
    <form className="rounded-lg border bg-white p-4 shadow-card" onSubmit={onSubmit}>
      <div className="mb-3 flex items-center gap-3 border-b pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-primary">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Add teammate</h2>
          <p className="text-xs text-slate-500">Set the right access from day one.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
        <Input name="email" type="email" placeholder="Email" required aria-label="Invite email" />
        <Input name="name" placeholder="Name" aria-label="Invite name" />
        <Select name="role" defaultValue="MEMBER" aria-label="Role">
          <option value="MEMBER">Member</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Button>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </div>
      {message ? <p className="mt-3 text-xs font-medium text-slate-600">{message}</p> : null}
    </form>
  );
}
