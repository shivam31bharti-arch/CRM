"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Save } from "lucide-react";
import { CompanySelect, type CompanyOption } from "@/components/companies/CompanySelect";
import { Button } from "@/components/ui/Button";

type ContactCompanyEditorProps = {
  contactId: string;
  company?: CompanyOption | null;
};

export function ContactCompanyEditor({ contactId, company = null }: ContactCompanyEditorProps) {
  const [companyId, setCompanyId] = useState(company?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setCompanyId(company?.id ?? "");
  }, [company?.id]);

  async function saveAssociation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: companyId || null, company: "" })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error ?? "Company association could not be updated.");
        return;
      }
      setMessage(companyId ? "Company association updated." : "Company association removed.");
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      router.refresh();
    } catch {
      setMessage("Company association could not be updated. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="rounded-lg border bg-white p-4 shadow-card"
      onSubmit={saveAssociation}
      aria-busy={saving}
    >
      <div className="mb-4 flex items-center gap-3 border-b pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Company association</h2>
          <p className="text-xs text-slate-500">Link this contact to the correct account.</p>
        </div>
      </div>
      <CompanySelect
        value={companyId}
        onChange={setCompanyId}
        selectedCompany={company}
        disabled={saving}
      />
      <Button className="mt-3 w-full" type="submit" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {saving ? "Saving…" : "Save association"}
      </Button>
      {message ? (
        <p
          className="mt-3 text-sm font-medium text-slate-600"
          role={message.includes("could not") ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
