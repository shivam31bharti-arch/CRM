"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, LockKeyhole, Save, UserRound } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function ProfileForm() {
  const [message, setMessage] = useState("");
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/settings/profile")).json()
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
    });
    setMessage(response.ok ? "Profile changes saved." : "Profile could not be updated.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form className="rounded-lg border bg-white shadow-card" onSubmit={onSubmit}>
        <div className="flex items-center gap-3 border-b p-4">
          <Avatar name={data?.name ?? data?.email} src={data?.avatarUrl} className="h-12 w-12" />
          <div>
            <h2 className="font-semibold text-slate-950">Personal information</h2>
            <p className="text-xs text-slate-500">
              Used for ownership, assignments, and workspace activity.
            </p>
          </div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Name
            <Input className="mt-1" name="name" defaultValue={data?.name ?? ""} required />
          </label>
          <label className="text-sm font-medium">
            Email
            <Input
              className="mt-1"
              name="email"
              type="email"
              defaultValue={data?.email ?? ""}
              required
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Avatar URL
            <Input
              className="mt-1"
              name="avatarUrl"
              defaultValue={data?.avatarUrl ?? ""}
              placeholder="https://..."
            />
          </label>
          <div className="border-t pt-4 md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-900">Password security</p>
            </div>
            <label className="text-sm font-medium">
              New password
              <Input
                className="mt-1"
                name="password"
                type="password"
                minLength={8}
                placeholder="Leave blank to keep current password"
              />
            </label>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Button>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save changes
            </Button>
            {message ? (
              <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {message}
              </span>
            ) : null}
          </div>
        </div>
      </form>
      <Card className="self-start">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-sm font-semibold text-slate-950">Workspace identity</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          A complete profile makes assignments, notes, activity logs, and team handoffs easier to
          understand.
        </p>
        <ul className="mt-4 space-y-2 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Visible in ownership fields
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Attached to CRM activity
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Protected with account authentication
          </li>
        </ul>
      </Card>
    </div>
  );
}
