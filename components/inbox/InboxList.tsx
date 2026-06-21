"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, MailOpen, MessageSquareText, Reply, Search } from "lucide-react";
import { InboxItem, type InboxRow } from "@/components/inbox/InboxItem";
import { PlatformFilter } from "@/components/inbox/PlatformFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EMPTY_MESSAGES: InboxRow[] = [];

export function InboxList() {
  const [platform, setPlatform] = useState("");
  const [read, setRead] = useState("");
  const [search, setSearch] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (read) params.set("read", read);
    return params.toString();
  }, [platform, read]);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["inbox", query],
    queryFn: async () => (await fetch(`/api/inbox?${query}`)).json()
  });
  const items: InboxRow[] = data?.items ?? EMPTY_MESSAGES;
  const visibleItems = items.filter((item) =>
    `${item.senderName} ${item.body}`.toLowerCase().includes(search.toLowerCase())
  );
  const replied = items.filter((item) => item.isReplied).length;
  const linked = items.filter((item) => item.contact).length;

  async function markAllRead() {
    await fetch("/api/inbox", { method: "PATCH" });
    await refetch();
  }

  return (
    <div className="space-y-4">
      <WorkspaceMetrics
        items={[
          {
            label: "Unread",
            value: data?.unreadCount ?? 0,
            helper: "Needs attention",
            icon: MessageSquareText,
            tone: "red"
          },
          {
            label: "In this view",
            value: items.length,
            helper: "Conversations",
            icon: MailOpen,
            tone: "blue"
          },
          {
            label: "Replied",
            value: replied,
            helper: "Response complete",
            icon: Reply,
            tone: "green"
          },
          {
            label: "CRM linked",
            value: linked,
            helper: "Known relationships",
            icon: Link2,
            tone: "violet"
          }
        ]}
      />
      <div className="flex flex-col gap-3 border-y border-slate-200 bg-white/60 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search inbox</span>
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people or messages"
            />
          </label>
          <PlatformFilter
            platform={platform}
            read={read}
            onPlatform={setPlatform}
            onRead={setRead}
          />
        </div>
        <Button variant="secondary" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      {isLoading ? <LoadingState rows={5} /> : null}
      {!isLoading && visibleItems.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="Inbox is clear"
          body="No conversations match this view. New social messages will land here automatically."
          action="Review integrations"
          href="/settings/integrations"
        />
      ) : null}
      <div className="space-y-3">
        {visibleItems.map((item) => (
          <InboxItem key={item.id} item={item} onChanged={() => refetch()} />
        ))}
      </div>
    </div>
  );
}
