"use client";

import { useQuery } from "@tanstack/react-query";
import { KeyRound, PlugZap, Radio, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { ApiKeyManager } from "@/components/settings/ApiKeyManager";
import { IntegrationCard } from "@/components/settings/IntegrationCard";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { WebhookManager } from "@/components/settings/WebhookManager";

type PlatformConnection = {
  platform: string;
  account: { accountName: string; followerCount?: number | null; isActive: boolean } | null;
};
const EMPTY_CONNECTIONS: PlatformConnection[] = [];

export default function IntegrationsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => (await fetch("/api/settings/integrations")).json()
  });
  const platforms: PlatformConnection[] = data?.platforms ?? EMPTY_CONNECTIONS;
  const connected = platforms.filter((item) => item.account?.isActive).length;
  const followers = platforms.reduce((sum, item) => sum + (item.account?.followerCount ?? 0), 0);
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Integration Hub"
        description="Connect customer channels and extend the CRM with secure automation endpoints."
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
            },
            {
              label: "Developer access",
              value: "Ready",
              helper: "Webhooks and keys",
              icon: KeyRound,
              tone: "amber"
            }
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((item) => (
            <IntegrationCard
              key={item.platform}
              platform={item.platform}
              account={item.account}
              onChanged={() => refetch()}
            />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <WebhookManager />
          <ApiKeyManager />
        </div>
      </div>
    </>
  );
}
