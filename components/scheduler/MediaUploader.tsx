// Media URL input that mirrors Uploadthing-backed storage shape for local development.
"use client";

import { Input } from "@/components/ui/Input";

export function MediaUploader({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Input
          key={index}
          value={urls[index] ?? ""}
          placeholder={`Media URL ${index + 1}`}
          onChange={(event) => {
            const next = [...urls];
            next[index] = event.target.value;
            onChange(next.filter(Boolean).slice(0, 4));
          }}
        />
      ))}
    </div>
  );
}
