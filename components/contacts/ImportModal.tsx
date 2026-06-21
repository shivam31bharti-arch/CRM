"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export function ImportModal({ onImported }: { onImported?: () => void }) {
  const [csv, setCsv] = useState(
    "firstName,lastName,email,company\nAda,Lovelace,ada@example.com,Analytical Engines"
  );
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  async function importCsv() {
    const response = await fetch("/api/contacts/import", { method: "POST", body: csv });
    setMessage(response.ok ? "Contacts imported." : "Import could not be completed.");
    if (response.ok) await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    onImported?.();
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-3 border-b pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <FileUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Bulk import</h2>
          <p className="text-xs text-slate-500">
            Paste a clean CSV to create contacts in one pass.
          </p>
        </div>
      </div>
      <label className="text-sm font-medium">
        CSV preview
        <Textarea
          className="mt-1 min-h-28 font-mono text-xs"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
        />
      </label>
      <Button className="mt-3" variant="secondary" onClick={importCsv}>
        <FileUp className="h-4 w-4" aria-hidden="true" />
        Import CSV
      </Button>
      {message ? <p className="mt-3 text-xs font-medium text-slate-600">{message}</p> : null}
    </div>
  );
}
