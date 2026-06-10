// Contact linker using a direct contact id for fast MVP operation.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ContactLinker({ id, onLinked }: { id: string; onLinked?: () => void }) {
  const [contactId, setContactId] = useState("");
  async function link() {
    await fetch(`/api/inbox/${id}/link-contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId }) });
    onLinked?.();
  }
  return (
    <div className="mt-3 flex gap-2">
      <Input value={contactId} onChange={(event) => setContactId(event.target.value)} placeholder="Contact id" aria-label="Contact id" />
      <Button variant="secondary" onClick={link} disabled={!contactId}>Link</Button>
    </div>
  );
}
