// Date range control for analytics queries.
"use client";

import { subDays } from "date-fns";
import { Input } from "@/components/ui/Input";

export function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input type="date" aria-label="From date" value={from} onChange={(event) => onChange(event.target.value, to)} />
      <Input type="date" aria-label="To date" value={to} onChange={(event) => onChange(from, event.target.value)} />
      <button type="button" className="sr-only" onClick={() => onChange(subDays(new Date(), 30).toISOString().slice(0, 10), new Date().toISOString().slice(0, 10))}>
        Last 30 days
      </button>
    </div>
  );
}
