// Team management page.
"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityFeed } from "@/components/team/ActivityFeed";
import { InviteModal } from "@/components/team/InviteModal";
import { TeamTable } from "@/components/team/TeamTable";

export default function TeamPage() {
  const { data, refetch } = useQuery({ queryKey: ["team"], queryFn: async () => (await fetch("/api/team")).json() });
  return (
    <>
      <PageHeader title="Team" description="Manage roles, invites, assignments, and collaboration activity." />
      <div className="space-y-4">
        <InviteModal onInvited={() => refetch()} />
        <TeamTable />
        <ActivityFeed items={data?.activity ?? []} />
      </div>
    </>
  );
}
