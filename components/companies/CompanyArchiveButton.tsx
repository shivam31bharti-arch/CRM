"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CompanyArchiveButton({
  companyId,
  companyName
}: {
  companyId: string;
  companyName: string;
}) {
  const [archiving, setArchiving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function archiveCompany() {
    if (!window.confirm(`Archive ${companyName}? Contacts will remain available.`)) return;
    setArchiving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error ?? "Company could not be archived.");
        return;
      }
      router.push("/companies");
      router.refresh();
    } catch {
      setMessage("Company could not be archived. Check your connection and try again.");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="danger" onClick={archiveCompany} disabled={archiving}>
        <Archive className="h-4 w-4" aria-hidden="true" />
        {archiving ? "Archiving…" : "Archive"}
      </Button>
      {message ? (
        <p className="mt-2 text-xs font-medium text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
