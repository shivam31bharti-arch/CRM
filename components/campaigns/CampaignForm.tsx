// Campaign create form.
"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function CampaignForm({ onCreated }: { onCreated?: () => void }) {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    form.reset();
    onCreated?.();
  }
  return (
    <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4" onSubmit={onSubmit}>
      <Input name="name" placeholder="Campaign name" required aria-label="Campaign name" />
      <Input name="description" placeholder="Description" aria-label="Description" />
      <Select name="status" defaultValue="DRAFT" aria-label="Status">
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="PAUSED">Paused</option>
        <option value="COMPLETED">Completed</option>
      </Select>
      <Button>Create campaign</Button>
    </form>
  );
}
