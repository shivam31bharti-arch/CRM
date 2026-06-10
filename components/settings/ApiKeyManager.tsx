// API key manager stub that shows a generated key once.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ApiKeyManager() {
  const [key, setKey] = useState("");
  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-semibold">API keys</h2>
      {key ? <p className="mb-3 rounded-md bg-slate-100 p-2 font-mono text-xs">{key}</p> : <p className="mb-3 text-sm text-slate-500">Generated keys are shown once and hashed before storage in production.</p>}
      <Button variant="secondary" onClick={() => setKey(`sk_live_local_${crypto.randomUUID().replaceAll("-", "")}`)}>Generate key</Button>
    </div>
  );
}
