"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, ChevronDown, Link2, Reply } from "lucide-react";
import { ContactLinker } from "@/components/inbox/ContactLinker";
import { ReplyComposer } from "@/components/inbox/ReplyComposer";
import { Avatar } from "@/components/shared/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
  contact?: { id: string; firstName: string; lastName: string } | null;
};

export function InboxItem({ item, onChanged }: { item: InboxRow; onChanged?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  async function markRead() {
    await fetch(`/api/inbox/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true })
    });
    onChanged?.();
  }

  return (
    <article
      className={cn(
        "rounded-lg border bg-white shadow-card transition",
        !item.isRead && "border-l-4 border-l-primary"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Avatar name={item.senderName} src={item.senderAvatarUrl} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-950">{item.senderName}</h2>
              <Badge>{item.platform}</Badge>
              <Badge>{item.type}</Badge>
              {item.contact ? <Badge tone="CUSTOMER">CRM linked</Badge> : null}
            </div>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setExpanded((value) => !value)}>
              <Reply className="h-4 w-4" aria-hidden="true" />
              {item.isReplied ? "Reply again" : "Reply"}
              <ChevronDown
                className={cn("h-4 w-4 transition", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </Button>
            {!item.isRead ? (
              <Button variant="ghost" onClick={markRead}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Mark read
              </Button>
            ) : null}
            {item.contact ? (
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                {item.contact.firstName} {item.contact.lastName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {expanded ? (
        <div className="grid gap-4 border-t bg-slate-50/70 p-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Send response</p>
            <ReplyComposer id={item.id} onSent={onChanged} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Link relationship</p>
            <ContactLinker id={item.id} onLinked={onChanged} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
