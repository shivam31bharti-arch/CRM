// API key manager stub that shows a generated key once.
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ApiKeyManager() {
  const [key, setKey] = useState("");
  const [name, setName] = useState("Local integration key");
  const { data, refetch } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => (await fetch("/api/settings/api-keys")).json()
  });

  async function generateKey() {
    const response = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!response.ok) return;
    const body = await response.json();
    setKey(body.key);
    await refetch();
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-semibold">API keys</h2>
      {key ? (
        <p className="mb-3 rounded-md bg-slate-100 p-2 font-mono text-xs">{key}</p>
      ) : (
        <p className="mb-3 text-sm text-slate-500">Generated keys are shown once. Only a hash and display prefix are stored.</p>
      )}
      <div className="flex gap-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} aria-label="API key name" />
        <Button variant="secondary" onClick={generateKey}>
          Generate key
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {data?.items?.map((item: { id: string; name: string; prefix: string; lastFour: string }) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm">
            <span>{item.name}</span>
            <span className="font-mono text-xs text-slate-500">
              {item.prefix}...{item.lastFour}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
