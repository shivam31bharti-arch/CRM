// Slide-over-ready deal form used by the pipeline page.
"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function DealForm({ onCreated }: { onCreated?: () => void }) {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    form.reset();
    onCreated?.();
  }
  return (
    <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-5" onSubmit={onSubmit}>
      <Input name="title" placeholder="Deal title" required className="md:col-span-2" aria-label="Deal title" />
      <Input name="value" type="number" min={0} placeholder="Value" aria-label="Deal value" />
      <Input name="probability" type="number" min={0} max={100} placeholder="Probability" aria-label="Probability" />
      <Select name="stage" defaultValue="LEAD" aria-label="Stage">
        <option value="LEAD">Lead</option>
        <option value="QUALIFIED">Qualified</option>
        <option value="PROPOSAL">Proposal</option>
        <option value="NEGOTIATION">Negotiation</option>
      </Select>
      <Button type="submit">Create deal</Button>
    </form>
  );
}
