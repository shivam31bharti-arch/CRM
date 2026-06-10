// Social post composer with platform validation, media URLs, schedule, and recurrence.
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { CharacterCounter } from "@/components/scheduler/CharacterCounter";
import { MediaUploader } from "@/components/scheduler/MediaUploader";
import { PlatformSelector } from "@/components/scheduler/PlatformSelector";
import { RecurringRuleBuilder } from "@/components/scheduler/RecurringRuleBuilder";

export function PostComposer() {
  const [platform, setPlatform] = useState<"TWITTER" | "LINKEDIN" | "INSTAGRAM" | "FACEBOOK">("TWITTER");
  const [body, setBody] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [recurringRule, setRecurringRule] = useState("");
  const accounts = useQuery({ queryKey: ["social-accounts"], queryFn: async () => (await fetch("/api/social-accounts")).json() });
  const accountId = accounts.data?.items?.find((item: { platform: string }) => item.platform === platform)?.id ?? accounts.data?.items?.[0]?.id;

  useEffect(() => {
    const timer = window.setInterval(() => localStorage.setItem("post-draft", JSON.stringify({ platform, body, mediaUrls })), 30_000);
    return () => window.clearInterval(timer);
  }, [platform, body, mediaUrls]);

  async function submit(status: "DRAFT" | "SCHEDULED") {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        platform,
        mediaUrls,
        status,
        socialAccountId: accountId,
        scheduledAt: status === "SCHEDULED" ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
        isRecurring: Boolean(recurringRule),
        recurringRule
      })
    });
    setBody("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <PlatformSelector value={platform} onChange={(value) => setPlatform(value as typeof platform)} />
          <Select aria-label="Social account" value={accountId ?? ""} onChange={() => undefined}>
            {accounts.data?.items?.map((account: { id: string; accountName: string; platform: string }) => (
              <option key={account.id} value={account.id}>
                {account.accountName} ({account.platform})
              </option>
            ))}
          </Select>
        </div>
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write the post..." />
        <div className="mt-2 flex items-center justify-between">
          <CharacterCounter platform={platform} value={body} />
          <span className="text-xs text-slate-500">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input type="datetime-local" aria-label="Schedule date and time" />
          <RecurringRuleBuilder value={recurringRule} onChange={setRecurringRule} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => submit("SCHEDULED")} disabled={!body || !accountId}>
            Schedule post
          </Button>
          <Button variant="secondary" onClick={() => submit("DRAFT")} disabled={!body || !accountId}>
            Save draft
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Media</h2>
        <MediaUploader urls={mediaUrls} onChange={setMediaUrls} />
      </div>
    </div>
  );
}
