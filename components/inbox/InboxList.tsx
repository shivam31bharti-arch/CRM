// Unified inbox list with filters and unread management.
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PlatformFilter } from "@/components/inbox/PlatformFilter";
import { InboxItem, type InboxRow } from "@/components/inbox/InboxItem";

export function InboxList() {
  const [platform, setPlatform] = useState("");
  const [read, setRead] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (read) params.set("read", read);
    return params.toString();
  }, [platform, read]);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["inbox", query], queryFn: async () => (await fetch(`/api/inbox?${query}`)).json() });
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PlatformFilter platform={platform} read={read} onPlatform={setPlatform} onRead={setRead} />
        <Button variant="secondary" onClick={async () => { await fetch("/api/inbox", { method: "PATCH" }); refetch(); }}>Mark all read</Button>
      </div>
      {isLoading ? <LoadingState rows={5} /> : null}
      {!isLoading && data?.items?.length === 0 ? <EmptyState title="Inbox is clear" body="No messages match the selected filters." /> : null}
      <div className="space-y-3">{data?.items?.map((item: InboxRow) => <InboxItem key={item.id} item={item} onChanged={() => refetch()} />)}</div>
    </div>
  );
}
