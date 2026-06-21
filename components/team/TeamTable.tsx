import { ShieldCheck, Users } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";

export type TeamMemberRow = {
  id: string;
  role: string;
  joinedAt: string;
  user: { name?: string | null; email: string; avatarUrl?: string | null };
};

export function TeamTable({ members }: { members: TeamMemberRow[] }) {
  if (!members.length)
    return (
      <EmptyState
        icon={Users}
        title="No team members yet"
        body="Invite a collaborator to begin sharing ownership."
      />
    );
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Team directory</h2>
          <p className="text-xs text-slate-500">Roles and workspace access.</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Role protected
        </span>
      </div>
      <DataTable<TeamMemberRow>
        rows={members}
        columns={[
          {
            key: "user",
            header: "Member",
            render: (row) => (
              <span className="flex items-center gap-2">
                <Avatar name={row.user.name} src={row.user.avatarUrl} className="h-8 w-8" />
                <span>
                  <span className="block font-semibold text-slate-900">
                    {row.user.name ?? "Unnamed member"}
                  </span>
                  <span className="block text-xs text-slate-500">{row.user.email}</span>
                </span>
              </span>
            )
          },
          {
            key: "role",
            header: "Role",
            render: (row) => (
              <Badge tone={row.role === "ADMIN" ? "ACTIVE" : undefined}>
                {row.role.toLowerCase()}
              </Badge>
            )
          },
          { key: "joinedAt", header: "Joined", render: (row) => row.joinedAt.slice(0, 10) }
        ]}
      />
    </div>
  );
}
