"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Activity, ShieldCheck, UserRoundCog, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { ActivityFeed } from "@/components/team/ActivityFeed";
import { InviteModal } from "@/components/team/InviteModal";
import { TeamTable, type TeamMemberRow } from "@/components/team/TeamTable";
import { apiJson } from "@/lib/client-api";

type ActivityRow = {
  id: string;
  description: string;
  createdAt: string;
  user?: { name?: string | null };
};
const EMPTY_MEMBERS: TeamMemberRow[] = [];
const EMPTY_ACTIVITY: ActivityRow[] = [];

export default function TeamPage() {
  const { data: session } = useSession();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["team"],
    queryFn: () => apiJson<{ items: TeamMemberRow[]; activity: ActivityRow[] }>("/api/team")
  });
  const members: TeamMemberRow[] = data?.items ?? EMPTY_MEMBERS;
  const activity: ActivityRow[] = data?.activity ?? EMPTY_ACTIVITY;
  const admins = members.filter((member) => member.role === "ADMIN").length;
  const managers = members.filter((member) => member.role === "MANAGER").length;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Team Operations"
        description="Clarify access, share ownership, and see how work is moving across the CRM."
      />
      {isLoading ? (
        <LoadingState rows={6} />
      ) : (
        <div className="space-y-4">
          <WorkspaceMetrics
            items={[
              {
                label: "Team members",
                value: members.length,
                helper: "Workspace seats",
                icon: Users,
                tone: "blue"
              },
              {
                label: "Administrators",
                value: admins,
                helper: "Full access",
                icon: ShieldCheck,
                tone: "red"
              },
              {
                label: "Managers",
                value: managers,
                helper: "Operational leads",
                icon: UserRoundCog,
                tone: "violet"
              },
              {
                label: "Recent activity",
                value: activity.length,
                helper: "Recorded changes",
                icon: Activity,
                tone: "green"
              }
            ]}
          />
          {session?.user?.role === "ADMIN" ? <InviteModal onInvited={() => refetch()} /> : null}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
            <TeamTable
              members={members}
              canManage={session?.user?.role === "ADMIN"}
              currentUserId={session?.user?.id}
              onChanged={() => refetch()}
            />
            <ActivityFeed items={activity} />
          </div>
        </div>
      )}
    </>
  );
}
