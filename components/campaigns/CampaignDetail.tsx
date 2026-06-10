// Campaign detail view with linked records.
import { CampaignAnalytics } from "@/components/campaigns/CampaignAnalytics";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function CampaignDetail({ campaign }: { campaign: { name: string; description?: string | null; status: string; posts: Array<{ id: string; body: string; status: string; analytics?: Array<{ reach: number; likes: number; comments: number; shares: number }> }>; contacts: Array<{ contact: { id: string; firstName: string; lastName: string } }>; deals: Array<{ deal: { id: string; title: string } }> } }) {
  return (
    <div className="space-y-4">
      <CampaignAnalytics posts={campaign.posts} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><h2 className="mb-3 font-semibold">Posts</h2>{campaign.posts.map((post) => <p key={post.id} className="border-t py-2 text-sm">{post.body} <Badge tone={post.status}>{post.status}</Badge></p>)}</Card>
        <Card><h2 className="mb-3 font-semibold">Contacts</h2>{campaign.contacts.map(({ contact }) => <p key={contact.id} className="border-t py-2 text-sm">{contact.firstName} {contact.lastName}</p>)}</Card>
        <Card><h2 className="mb-3 font-semibold">Deals</h2>{campaign.deals.map(({ deal }) => <p key={deal.id} className="border-t py-2 text-sm">{deal.title}</p>)}</Card>
      </div>
    </div>
  );
}
