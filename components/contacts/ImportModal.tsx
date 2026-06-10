// CSV import panel for contacts.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export function ImportModal({ onImported }: { onImported?: () => void }) {
  const [csv, setCsv] = useState("firstName,lastName,email,company\nAda,Lovelace,ada@example.com,Analytical Engines");
  async function importCsv() {
    await fetch("/api/contacts/import", { method: "POST", body: csv });
    onImported?.();
  }
  return (
    <div className="rounded-lg border bg-white p-4">
      <label className="text-sm font-medium">
        CSV preview
        <Textarea className="mt-1 font-mono text-xs" value={csv} onChange={(event) => setCsv(event.target.value)} />
      </label>
      <Button className="mt-3" variant="secondary" onClick={importCsv}>
        Import CSV
      </Button>
    </div>
  );
}
