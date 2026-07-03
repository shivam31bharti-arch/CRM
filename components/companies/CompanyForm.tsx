"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { apiJson } from "@/lib/client-api";

type CompanyFormProps = {
  company?: {
    id: string;
    name: string;
    website?: string | null;
    industry?: string | null;
    phone?: string | null;
    description?: string | null;
    ownerId?: string | null;
  };
  onSaved?: () => void;
};

export function CompanyForm({ company, onSaved }: CompanyFormProps) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [ownerId, setOwnerId] = useState(company?.ownerId ?? "");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const editing = Boolean(company);
  const canAssignOwner = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
  const teamQuery = useQuery({
    queryKey: ["team", "company-owner-options"],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          user: { id: string; name?: string | null; email: string };
        }>;
      }>("/api/team"),
    enabled: canAssignOwner
  });

  useEffect(() => {
    setOwnerId(company?.ownerId ?? "");
  }, [company?.ownerId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    const form = event.currentTarget;
    const payload: Record<string, FormDataEntryValue | null> = Object.fromEntries(
      new FormData(form)
    );
    if (payload.ownerId === "") payload.ownerId = null;
    try {
      const response = await fetch(company ? `/api/companies/${company.id}` : "/api/companies", {
        method: company ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error ?? "Company could not be saved.");
        return;
      }
      if (!editing) {
        form.reset();
        setOwnerId("");
      }
      setMessage(editing ? "Company updated." : "Company created.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      router.refresh();
      onSaved?.();
    } catch {
      setMessage("Company could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="rounded-lg border bg-white p-4 shadow-card"
      onSubmit={onSubmit}
      aria-busy={saving}
    >
      <div className="mb-4 flex items-center gap-3 border-b pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            {editing ? "Company profile" : "Add company"}
          </h2>
          <p className="text-xs text-slate-500">
            {editing ? "Keep account context current." : "Create an account for related contacts."}
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        <label className="text-sm font-medium">
          Company name
          <Input
            className="mt-1"
            name="name"
            defaultValue={company?.name}
            required
            maxLength={160}
          />
        </label>
        <label className="text-sm font-medium">
          Website
          <Input
            className="mt-1"
            name="website"
            type="url"
            placeholder="https://example.com"
            defaultValue={company?.website ?? ""}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Industry
            <Input
              className="mt-1"
              name="industry"
              defaultValue={company?.industry ?? ""}
              maxLength={120}
            />
          </label>
          <label className="text-sm font-medium">
            Phone
            <Input
              className="mt-1"
              name="phone"
              type="tel"
              defaultValue={company?.phone ?? ""}
              maxLength={50}
            />
          </label>
        </div>
        <label className="text-sm font-medium">
          Description
          <Textarea
            className="mt-1"
            name="description"
            defaultValue={company?.description ?? ""}
            maxLength={2000}
          />
        </label>
        {canAssignOwner ? (
          <label className="text-sm font-medium">
            Owner
            <Select
              className="mt-1"
              name="ownerId"
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
              disabled={saving || teamQuery.isLoading || teamQuery.isError}
            >
              <option value="">{editing ? "Unassigned" : "Assign to me"}</option>
              {(teamQuery.data?.items ?? []).map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name || member.user.email}
                </option>
              ))}
            </Select>
            {teamQuery.isError ? (
              <span className="mt-1 block text-xs text-red-700">
                Active teammate options could not be loaded.
              </span>
            ) : null}
          </label>
        ) : null}
      </div>
      <Button className="mt-4 w-full" type="submit" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {saving ? "Saving…" : editing ? "Save changes" : "Create company"}
      </Button>
      {message ? (
        <p className="mt-3 text-sm font-medium text-slate-600" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
