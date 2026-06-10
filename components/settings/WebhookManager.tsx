// Webhook manager with URL and event type input.
"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function WebhookManager() {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: form.get("url"), eventTypes: ["notification.created", "post.statusChanged"] }) });
  }
  return (
    <form className="rounded-lg border bg-white p-4" onSubmit={onSubmit}>
      <h2 className="mb-3 font-semibold">Webhooks</h2>
      <div className="flex gap-2"><Input name="url" type="url" placeholder="https://example.com/webhook" required /><Button>Create</Button></div>
    </form>
  );
}
