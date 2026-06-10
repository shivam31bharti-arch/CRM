// Integrations settings page.
"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiKeyManager } from "@/components/settings/ApiKeyManager";
import { IntegrationCard } from "@/components/settings/IntegrationCard";
import { WebhookManager } from "@/components/settings/WebhookManager";

export default function IntegrationsPage() {
  const { data, refetch } = useQuery({ queryKey: ["integrations"], queryFn: async () => (await fetch("/api/settings/integrations")).json() });
  return (
    <>
      <PageHeader title="Integrations" description="Connect social platforms, manage webhooks, and generate API keys." />
      <div className="grid gap-4 md:grid-cols-2">
        {data?.platforms?.map((item: { platform: string; account: { accountName: string; followerCount?: number | null; isActive: boolean } | null }) => (
          <IntegrationCard key={item.platform} platform={item.platform} account={item.account} onChanged={() => refetch()} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><WebhookManager /><ApiKeyManager /></div>
    </>
  );
}
