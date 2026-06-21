"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CircleDollarSign, Megaphone, Send, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { currency } from "@/lib/utils";

type CampaignRow = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  posts: Array<{ id: string; status: string }>;
  contacts: Array<{ contact: { id: string } }>;
  deals: Array<{ deal: { id: string; value: number } }>;
};

const EMPTY_CAMPAIGNS: CampaignRow[] = [];

export function CampaignList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await fetch("/api/campaigns")).json()
  });
  const campaigns: CampaignRow[] = data?.items ?? EMPTY_CAMPAIGNS;
  const visible = campaigns.filter(
    (campaign) =>
      (status === "ALL" || campaign.status === status) &&
      `${campaign.name} ${campaign.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const active = campaigns.filter((campaign) => campaign.status === "ACTIVE").length;
  const postCount = campaigns.reduce((sum, campaign) => sum + campaign.posts.length, 0);
  const audience = campaigns.reduce((sum, campaign) => sum + campaign.contacts.length, 0);
  const pipeline = campaigns.reduce(
    (sum, campaign) => sum + campaign.deals.reduce((dealSum, item) => dealSum + item.deal.value, 0),
    0
  );

  if (isLoading) return <LoadingState />;
  return (
    <div className="space-y-4">
      <WorkspaceMetrics
        items={[
          {
            label: "Active campaigns",
            value: active,
            helper: `${campaigns.length} total`,
            icon: Megaphone,
            tone: "red"
          },
          {
            label: "Campaign posts",
            value: postCount,
            helper: "Content attached",
            icon: Send,
            tone: "blue"
          },
          {
            label: "Audience",
            value: audience,
            helper: "Linked contacts",
            icon: Users,
            tone: "violet"
          },
          {
            label: "Influenced pipeline",
            value: currency(pipeline),
            helper: "Linked deal value",
            icon: CircleDollarSign,
            tone: "green"
          }
        ]}
      />
      <div className="grid gap-2 border-y border-slate-200 bg-white/60 py-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search campaigns"
          aria-label="Search campaigns"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Campaign status"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </Select>
      </div>
      {!visible.length ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns in this view"
          body="Create an initiative that connects content, audience, and revenue outcomes."
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((campaign) => {
          const published = campaign.posts.filter((post) => post.status === "PUBLISHED").length;
          const progress = campaign.posts.length
            ? Math.round((published / campaign.posts.length) * 100)
            : 0;
          const dealValue = campaign.deals.reduce((sum, item) => sum + item.deal.value, 0);
          return (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="focus-ring group rounded-lg border border-slate-200 bg-white p-4 shadow-card transition hover:border-primary/40 hover:shadow-panel"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-slate-400">Campaign</p>
                  <h2 className="mt-1 truncate font-semibold text-slate-950 group-hover:text-primary">
                    {campaign.name}
                  </h2>
                </div>
                <Badge tone={campaign.status}>{campaign.status.toLowerCase()}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                {campaign.description || "No description added yet."}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Publishing progress</span>
                  <span className="font-semibold text-slate-700">{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 border-t pt-3 text-center">
                <CampaignValue label="Posts" value={campaign.posts.length} />
                <CampaignValue label="Contacts" value={campaign.contacts.length} />
                <CampaignValue label="Pipeline" value={currency(dealValue)} />
              </div>
              <div className="mt-3 flex items-center justify-end text-xs font-semibold text-slate-600">
                Open campaign
                <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CampaignValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  );
}
