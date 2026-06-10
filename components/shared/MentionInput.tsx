// Mention-aware input that can trigger notification workflows.
"use client";

import { Textarea } from "@/components/ui/Textarea";

export function MentionInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const mentions = value.match(/@[a-zA-Z0-9._-]+/g) ?? [];
  return (
    <div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Write a note and mention teammates with @name" />
      {mentions.length ? <p className="mt-1 text-xs text-slate-500">Mentions: {mentions.join(", ")}</p> : null}
    </div>
  );
}
