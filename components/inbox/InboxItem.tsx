// Inbox message item with reply and contact linking actions.
"use client";

import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { ReplyComposer } from "@/components/inbox/ReplyComposer";
import { ContactLinker } from "@/components/inbox/ContactLinker";

export type InboxRow = {
  id: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  platform: string;
  type: string;
  body: string;
  isRead: boolean;
  isReplied: boolean;
  receivedAt: string;
};

export function InboxItem({ item, onChanged }: { item: InboxRow; onChanged?: () => void }) {
  return (
    <article className="rounded-lg border bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar name={item.senderName} src={item.senderAvatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{item.senderName}</h2>
            <Badge>{item.platform}</Badge>
            <Badge>{item.type}</Badge>
            {!item.isRead ? <Badge tone="FAILED">Unread</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-slate-700">{item.body}</p>
          <ReplyComposer id={item.id} onSent={onChanged} />
          <ContactLinker id={item.id} onLinked={onChanged} />
        </div>
      </div>
    </article>
  );
}
