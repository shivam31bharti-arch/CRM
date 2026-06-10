// Team member table with roles and join dates.
"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/shared/Avatar";
import { DataTable } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/Badge";

type Member = { id: string; role: string; joinedAt: string; user: { name?: string | null; email: string; avatarUrl?: string | null } };

export function TeamTable() {
  const { data, isLoading } = useQuery({ queryKey: ["team"], queryFn: async () => (await fetch("/api/team")).json() });
  if (isLoading) return <LoadingState />;
  return (
    <DataTable<Member>
      rows={data?.items ?? []}
      columns={[
        { key: "user", header: "Member", render: (row) => <span className="flex items-center gap-2"><Avatar name={row.user.name} src={row.user.avatarUrl} className="h-8 w-8" />{row.user.name ?? row.user.email}</span> },
        { key: "role", header: "Role", render: (row) => <Badge>{row.role}</Badge> },
        { key: "joinedAt", header: "Joined", render: (row) => row.joinedAt.slice(0, 10) }
      ]}
    />
  );
}
