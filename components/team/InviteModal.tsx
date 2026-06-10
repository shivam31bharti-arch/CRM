// Team invite panel for admins.
"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function InviteModal({ onInvited }: { onInvited?: () => void }) {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    form.reset();
    onInvited?.();
  }
  return (
    <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4" onSubmit={onSubmit}>
      <Input name="email" type="email" placeholder="Email" required aria-label="Invite email" />
      <Input name="name" placeholder="Name" aria-label="Invite name" />
      <Select name="role" defaultValue="MEMBER" aria-label="Role"><option value="MEMBER">Member</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></Select>
      <Button>Invite</Button>
    </form>
  );
}
