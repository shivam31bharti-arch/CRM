// Campaign list with status badges and linked counts.
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";

export function CampaignList() {
  const { data, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: async () => (await fetch("/api/campaigns")).json() });
  if (isLoading) return <LoadingState />;
  if (!data?.items?.length) return <EmptyState title="No campaigns" body="Create a campaign to group posts, contacts, and pipeline impact." />;
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {data.items.map((campaign: { id: string; name: string; status: string; posts: unknown[]; contacts: unknown[] }) => (
        <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="rounded-lg border bg-white p-4 hover:border-blue-300">
          <div className="flex items-center justify-between"><h2 className="font-semibold">{campaign.name}</h2><Badge tone={campaign.status}>{campaign.status}</Badge></div>
          <p className="mt-3 text-sm text-slate-500">{campaign.posts.length} posts · {campaign.contacts.length} contacts</p>
        </Link>
      ))}
    </div>
  );
}
