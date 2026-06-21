"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function DealForm({ onCreated }: { onCreated?: () => void }) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    if (!response.ok) {
      setMessage("Deal could not be saved.");
      return;
    }
    form.reset();
    setMessage("Deal created.");
    await queryClient.invalidateQueries({ queryKey: ["deals"] });
    onCreated?.();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Opportunity capture</h2>
          <p className="text-xs text-slate-500">
            Add a qualified revenue opportunity to the board.
          </p>
        </div>
        <Button variant={open ? "ghost" : "primary"} onClick={() => setOpen((value) => !value)}>
          {open ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {open ? "Close" : "New deal"}
        </Button>
      </div>
      {open ? (
        <form className="grid gap-3 border-t p-4 md:grid-cols-6" onSubmit={onSubmit}>
          <Input
            name="title"
            placeholder="Deal title"
            required
            className="md:col-span-2"
            aria-label="Deal title"
          />
          <Input name="value" type="number" min={0} placeholder="Value" aria-label="Deal value" />
          <Input
            name="probability"
            type="number"
            min={0}
            max={100}
            placeholder="Probability %"
            aria-label="Probability"
          />
          <Select name="stage" defaultValue="LEAD" aria-label="Stage">
            <option value="LEAD">Lead</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
          </Select>
          <Button type="submit">Create deal</Button>
          {message ? (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 md:col-span-6">
              {message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
