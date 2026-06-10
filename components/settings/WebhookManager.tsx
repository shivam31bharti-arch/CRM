// Webhook manager with URL and event type input.
"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function WebhookManager() {
  const { data, refetch } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => (await fetch("/api/webhooks")).json()
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: form.get("url"), eventTypes: ["notification.created", "post.statusChanged"] }) });
    await refetch();
  }
  return (
    <form className="rounded-lg border bg-white p-4" onSubmit={onSubmit}>
      <h2 className="mb-3 font-semibold">Webhooks</h2>
      <div className="flex gap-2"><Input name="url" type="url" placeholder="https://example.com/webhook" required /><Button>Create</Button></div>
      <div className="mt-4 space-y-2">
        {data?.items?.map((item: { id: string; url: string; eventTypes: string[] }) => (
          <div key={item.id} className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
            <p className="font-medium">{item.url}</p>
            <p className="text-xs text-slate-500">{item.eventTypes.join(", ")}</p>
          </div>
        ))}
      </div>
    </form>
  );
}
