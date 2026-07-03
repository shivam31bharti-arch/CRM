import { ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export type TeamMemberRow = {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
};

export function TeamTable({
  members,
  canManage = false,
  currentUserId,
  onChanged
}: {
  members: TeamMemberRow[];
  canManage?: boolean;
  currentUserId?: string;
  onChanged?: () => void;
}) {
  const [error, setError] = useState("");
  async function updateRole(id: string, role: string) {
    setError("");
    const response = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    if (response.ok) onChanged?.();
    else {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Role could not be updated.");
    }
  }

  async function removeMember(id: string) {
    if (!window.confirm("Remove this member's workspace access?")) return;
    setError("");
    const response = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (response.ok) onChanged?.();
    else {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Member could not be removed.");
    }
  }

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
      {error ? <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
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
          { key: "joinedAt", header: "Joined", render: (row) => row.joinedAt.slice(0, 10) },
          ...(canManage
            ? [
                {
                  key: "id" as const,
                  header: "Access",
                  render: (row: TeamMemberRow) => (
                    <span className="flex items-center justify-end gap-2">
                      <Select
                        className="w-32"
                        value={row.role}
                        aria-label={`Role for ${row.user.email}`}
                        onChange={(event) => updateRole(row.id, event.target.value)}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </Select>
                      <Button
                        variant="danger"
                        disabled={row.user.id === currentUserId}
                        onClick={() => removeMember(row.id)}
                      >
                        Remove
                      </Button>
                    </span>
                  )
                }
              ]
            : [])
        ]}
      />
    </div>
  );
}
