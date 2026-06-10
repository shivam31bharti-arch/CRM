// Profile settings form for current user.
"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileForm() {
  const { data } = useQuery({ queryKey: ["profile"], queryFn: async () => (await fetch("/api/settings/profile")).json() });
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
  }
  return (
    <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2" onSubmit={onSubmit}>
      <label className="text-sm font-medium">Name<Input className="mt-1" name="name" defaultValue={data?.name ?? ""} required /></label>
      <label className="text-sm font-medium">Email<Input className="mt-1" name="email" type="email" defaultValue={data?.email ?? ""} required /></label>
      <label className="text-sm font-medium">Avatar URL<Input className="mt-1" name="avatarUrl" defaultValue={data?.avatarUrl ?? ""} /></label>
      <label className="text-sm font-medium">New password<Input className="mt-1" name="password" type="password" minLength={8} /></label>
      <Button className="md:w-fit">Save profile</Button>
    </form>
  );
}
