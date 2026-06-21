"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function CampaignForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    if (!response.ok) {
      setMessage("Campaign could not be created.");
      return;
    }
    form.reset();
    setMessage("Campaign created.");
    await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    onCreated?.();
  }

  return (
    <div className="rounded-lg border bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-primary">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Campaign builder</h2>
            <p className="text-xs text-slate-500">
              Start with a clear initiative and connect records next.
            </p>
          </div>
        </div>
        <Button variant={open ? "ghost" : "primary"} onClick={() => setOpen((value) => !value)}>
          {open ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {open ? "Close" : "New campaign"}
        </Button>
      </div>
      {open ? (
        <form className="grid gap-3 border-t p-4 md:grid-cols-4" onSubmit={onSubmit}>
          <Input name="name" placeholder="Campaign name" required aria-label="Campaign name" />
          <Input name="description" placeholder="Outcome or audience" aria-label="Description" />
          <Select name="status" defaultValue="DRAFT" aria-label="Status">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <Button>Create campaign</Button>
          {message ? (
            <p className="text-sm font-medium text-slate-600 md:col-span-4">{message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
