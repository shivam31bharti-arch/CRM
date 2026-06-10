// Inbox platform and read-status filters.
"use client";

import { Select } from "@/components/ui/Select";

export function PlatformFilter({ platform, read, onPlatform, onRead }: { platform: string; read: string; onPlatform: (v: string) => void; onRead: (v: string) => void }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <Select value={platform} onChange={(event) => onPlatform(event.target.value)} aria-label="Platform filter">
        <option value="">All platforms</option>
        <option value="TWITTER">Twitter</option>
        <option value="LINKEDIN">LinkedIn</option>
        <option value="INSTAGRAM">Instagram</option>
        <option value="FACEBOOK">Facebook</option>
      </Select>
      <Select value={read} onChange={(event) => onRead(event.target.value)} aria-label="Read filter">
        <option value="">All messages</option>
        <option value="false">Unread</option>
        <option value="true">Read</option>
      </Select>
    </div>
  );
}
