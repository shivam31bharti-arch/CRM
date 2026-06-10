// Reply composer for inbox messages.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export function ReplyComposer({ id, onSent }: { id: string; onSent?: () => void }) {
  const [replyBody, setReplyBody] = useState("");
  async function send() {
    await fetch(`/api/inbox/${id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ replyBody }) });
    setReplyBody("");
    onSent?.();
  }
  return (
    <div className="mt-3">
      <Textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write a reply..." />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">{replyBody.length} characters</span>
        <Button onClick={send} disabled={!replyBody}>Reply</Button>
      </div>
    </div>
  );
}
