// Contact linker using a direct contact id for fast MVP operation.
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

type ContactOption = { id: string; firstName: string; lastName: string; company?: string | null };

export function ContactLinker({ id, onLinked }: { id: string; onLinked?: () => void }) {
  const [contactId, setContactId] = useState("");
  const [message, setMessage] = useState("");
  const contactsQuery = useQuery<{ items: ContactOption[] }>({
    queryKey: ["contact-link-options"],
    queryFn: async () => {
      const response = await fetch("/api/contacts?pageSize=100&sort=firstName&direction=asc");
      if (!response.ok) throw new Error("Contacts could not be loaded.");
      return response.json();
    }
  });

  async function link() {
    setMessage("");
    const response = await fetch(`/api/inbox/${id}/link-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Contact could not be linked.");
      return;
    }
    onLinked?.();
  }
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <Select
          value={contactId}
          onChange={(event) => setContactId(event.target.value)}
          aria-label="Contact"
          disabled={contactsQuery.isLoading}
        >
          <option value="">Select a contact</option>
          {(contactsQuery.data?.items ?? []).map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.firstName} {contact.lastName}
              {contact.company ? ` — ${contact.company}` : ""}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={link} disabled={!contactId}>
          Link
        </Button>
      </div>
      {contactsQuery.isError || message ? (
        <p className="mt-2 text-xs text-red-700">{message || "Contacts could not be loaded."}</p>
      ) : null}
    </div>
  );
}
