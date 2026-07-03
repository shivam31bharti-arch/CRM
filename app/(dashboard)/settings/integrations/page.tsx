"use client";

import { useQuery } from "@tanstack/react-query";
import { PlugZap, Radio, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { IntegrationCard } from "@/components/settings/IntegrationCard";
import { GoogleWorkspaceCard } from "@/components/settings/GoogleWorkspaceCard";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { apiJson } from "@/lib/client-api";

type PlatformConnection = {
  platform: string;
  account: { accountName: string; followerCount?: number | null; isActive: boolean } | null;
};
const EMPTY_CONNECTIONS: PlatformConnection[] = [];

export default function IntegrationsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => apiJson<{ platforms: PlatformConnection[] }>("/api/settings/integrations")
  });
  const platforms: PlatformConnection[] = data?.platforms ?? EMPTY_CONNECTIONS;
  const connected = platforms.filter((item) => item.account?.isActive).length;
  const followers = platforms.reduce((sum, item) => sum + (item.account?.followerCount ?? 0), 0);
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Integration Hub"
        description="Connect approved social channels for publishing. Analytics and inbox ingestion remain production roadmap work."
      />
      <SettingsNav />
      <div className="space-y-4">
        <WorkspaceMetrics
          items={[
            {
              label: "Connected channels",
              value: connected,
              helper: "Active social accounts",
              icon: PlugZap,
              tone: "green"
            },
            {
              label: "Channel coverage",
              value: platforms.length,
              helper: "Supported networks",
              icon: Radio,
              tone: "blue"
            },
            {
              label: "Audience connected",
              value: followers.toLocaleString(),
              helper: "Known followers",
              icon: Users,
              tone: "violet"
            }
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <GoogleWorkspaceCard />
          {platforms.map((item) => (
            <IntegrationCard
              key={item.platform}
              platform={item.platform}
              account={item.account}
              onChanged={() => refetch()}
            />
          ))}
        </div>
      </div>
    </>
  );
}
