import Link from "next/link";
import { CircleDollarSign, Eye, MessageCircle, Send } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency } from "@/lib/utils";

type Campaign = {
  name: string;
  description?: string | null;
  status: string;
  posts: Array<{
    id: string;
    body: string;
    status: string;
    analytics?: Array<{ reach: number; likes: number; comments: number; shares: number }>;
  }>;
  contacts: Array<{ contact: { id: string; firstName: string; lastName: string } }>;
  deals: Array<{ deal: { id: string; title: string; value?: number; currency?: string } }>;
};

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const reach = campaign.posts.reduce((sum, post) => sum + (post.analytics?.[0]?.reach ?? 0), 0);
  const engagement = campaign.posts.reduce(
    (sum, post) =>
      sum +
      (post.analytics?.[0]?.likes ?? 0) +
      (post.analytics?.[0]?.comments ?? 0) +
      (post.analytics?.[0]?.shares ?? 0),
    0
  );
  const pipeline = campaign.deals.reduce((sum, item) => sum + (item.deal.value ?? 0), 0);
  const published = campaign.posts.filter((post) => post.status === "PUBLISHED").length;
  return (
    <div className="space-y-4">
      <WorkspaceMetrics
        items={[
          {
            label: "Total reach",
            value: reach.toLocaleString(),
            helper: "Campaign audience",
            icon: Eye,
            tone: "blue"
          },
          {
            label: "Engagement",
            value: engagement.toLocaleString(),
            helper: "Meaningful interactions",
            icon: MessageCircle,
            tone: "green"
          },
          {
            label: "Published",
            value: published,
            helper: campaign.posts.length + " total posts",
            icon: Send,
            tone: "red"
          },
          {
            label: "Influenced pipeline",
            value: currency(pipeline),
            helper: campaign.deals.length + " linked deals",
            icon: CircleDollarSign,
            tone: "violet"
          }
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-slate-950">Content</h2>
            <Badge>{campaign.posts.length}</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {campaign.posts.length ? (
              campaign.posts.map((post) => (
                <div key={post.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm text-slate-700">{post.body}</p>
                    <Badge tone={post.status}>{post.status.toLowerCase()}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                compact
                icon={Send}
                title="No content linked"
                body="Attach posts from the Content Studio."
              />
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-slate-950">Audience</h2>
            <Badge>{campaign.contacts.length}</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {campaign.contacts.length ? (
              campaign.contacts.map(({ contact }) => (
                <Link
                  key={contact.id}
                  href={"/contacts/" + contact.id}
                  className="block rounded-md border p-3 text-sm font-semibold text-slate-800 transition hover:border-primary/40"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
              ))
            ) : (
              <EmptyState
                compact
                title="No contacts linked"
                body="Add the audience this campaign is designed to influence."
              />
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-slate-950">Pipeline</h2>
            <Badge>{campaign.deals.length}</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {campaign.deals.length ? (
              campaign.deals.map(({ deal }) => (
                <Link
                  key={deal.id}
                  href={"/deals/" + deal.id}
                  className="block rounded-md border p-3 transition hover:border-primary/40"
                >
                  <p className="text-sm font-semibold text-slate-900">{deal.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {currency(deal.value ?? 0, deal.currency)}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState
                compact
                icon={CircleDollarSign}
                title="No deals linked"
                body="Connect campaign activity to revenue."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
