"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, Clock3, ImageIcon, Save, Send, Sparkles } from "lucide-react";
import { CharacterCounter } from "@/components/scheduler/CharacterCounter";
import { MediaUploader } from "@/components/scheduler/MediaUploader";
import { PlatformSelector } from "@/components/scheduler/PlatformSelector";
import { RecurringRuleBuilder } from "@/components/scheduler/RecurringRuleBuilder";
import { Avatar } from "@/components/shared/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { platformLimits } from "@/lib/constants";

type Platform = "TWITTER" | "LINKEDIN" | "INSTAGRAM" | "FACEBOOK";
type SocialAccount = {
  id: string;
  accountName: string;
  platform: string;
  avatarUrl?: string | null;
};
const EMPTY_ACCOUNTS: SocialAccount[] = [];

export function PostComposer() {
  const [platform, setPlatform] = useState<Platform>("TWITTER");
  const [body, setBody] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [recurringRule, setRecurringRule] = useState("");
  const [accountId, setAccountId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [message, setMessage] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const queryClient = useQueryClient();
  const accountsQuery = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => (await fetch("/api/social-accounts")).json()
  });
  const accounts: SocialAccount[] = accountsQuery.data?.items ?? EMPTY_ACCOUNTS;
  const platformAccounts = useMemo(
    () => accounts.filter((item) => item.platform === platform),
    [accounts, platform]
  );
  const selectedAccount = accounts.find((item) => item.id === accountId) ?? platformAccounts[0];

  useEffect(() => {
    if (!platformAccounts.some((item) => item.id === accountId))
      setAccountId(platformAccounts[0]?.id ?? "");
  }, [accountId, platformAccounts]);

  useEffect(() => {
    setDraftSaved(false);
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        "post-draft",
        JSON.stringify({ platform, body, mediaUrls, scheduledAt, recurringRule })
      );
      setDraftSaved(true);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [platform, body, mediaUrls, scheduledAt, recurringRule]);

  async function submit(status: "DRAFT" | "SCHEDULED") {
    setMessage("");
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        platform,
        mediaUrls,
        status,
        socialAccountId: selectedAccount?.id,
        scheduledAt: status === "SCHEDULED" ? new Date(scheduledAt).toISOString() : null,
        isRecurring: Boolean(recurringRule),
        recurringRule
      })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Post could not be saved." }));
      setMessage(result.error ?? "Post could not be saved.");
      return;
    }
    setBody("");
    setMediaUrls([]);
    setMessage(
      status === "SCHEDULED"
        ? "Post added to the publishing queue."
        : "Draft saved to the content library."
    );
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
  }

  const withinLimit = body.length <= platformLimits[platform];
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-semibold text-slate-950">Create content</h2>
            <p className="text-xs text-slate-500">
              Shape the message, choose the channel, and set delivery.
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            {draftSaved ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            )}
            {draftSaved ? "Draft saved locally" : "Saving draft"}
          </span>
        </div>
        <div className="space-y-5 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Publish to</p>
            <PlatformSelector
              value={platform}
              onChange={(value) => setPlatform(value as Platform)}
            />
          </div>
          <label className="block text-sm font-medium">
            Social account
            <Select
              className="mt-1"
              aria-label="Social account"
              value={selectedAccount?.id ?? ""}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {platformAccounts.length ? (
                platformAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountName}
                  </option>
                ))
              ) : (
                <option value="">No {platform.toLowerCase()} account connected</option>
              )}
            </Select>
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="post-body" className="text-sm font-medium">
                Post copy
              </label>
              <CharacterCounter platform={platform} value={body} />
            </div>
            <Textarea
              id="post-body"
              className="min-h-56 resize-y text-base leading-7"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Start with the customer insight, then make the next action clear..."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Schedule date and time
              <div className="relative mt-1">
                <CalendarClock
                  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  className="pl-9"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
            </label>
            <label className="text-sm font-medium">
              Repeat rule
              <div className="mt-1">
                <RecurringRuleBuilder value={recurringRule} onChange={setRecurringRule} />
              </div>
            </label>
          </div>
          <div className="border-t pt-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-900">Media links</p>
              <Badge>{mediaUrls.length}/4</Badge>
            </div>
            <MediaUploader urls={mediaUrls} onChange={setMediaUrls} />
          </div>
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm font-medium text-slate-600">{message}</div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => submit("DRAFT")}
                disabled={!body || !selectedAccount}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save draft
              </Button>
              <Button
                onClick={() => submit("SCHEDULED")}
                disabled={!body || !selectedAccount || !withinLimit || !scheduledAt}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </section>
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <section className="overflow-hidden rounded-lg border bg-white shadow-card">
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">Live preview</h2>
            </div>
            <Badge>
              {platform === "TWITTER"
                ? "X / Twitter"
                : platform[0] + platform.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={selectedAccount?.accountName ?? "Your brand"}
                src={selectedAccount?.avatarUrl}
              />
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {selectedAccount?.accountName ?? "Your brand"}
                </p>
                <p className="text-xs text-slate-400">Just now</p>
              </div>
            </div>
            <p className="mt-4 min-h-28 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {body || "Your message will appear here as you write."}
            </p>
            {mediaUrls.length ? (
              <div className="mt-3 flex min-h-28 items-center justify-center rounded-md border bg-slate-50 text-sm font-medium text-slate-500">
                <ImageIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                {mediaUrls.length} media {mediaUrls.length === 1 ? "item" : "items"}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-slate-400">
              <span>Reply</span>
              <span>Repost</span>
              <span>Like</span>
              <span>Share</span>
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-950">Publish readiness</h2>
          <ul className="mt-3 space-y-2 text-xs text-amber-900">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden="true" />
              Channel selected
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden="true" />
              Schedule uses your local timezone
            </li>
            <li className="flex items-center gap-2">
              <span className={withinLimit && body ? "text-emerald-700" : "text-amber-700"}>
                {withinLimit && body ? "✓" : "○"}
              </span>
              Copy fits the platform limit
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
