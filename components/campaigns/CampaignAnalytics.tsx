// Campaign aggregate analytics.
import { Card } from "@/components/ui/Card";

export function CampaignAnalytics({ posts = [] }: { posts?: Array<{ status: string; analytics?: Array<{ reach: number; likes: number; comments: number; shares: number }> }> }) {
  const reach = posts.reduce((sum, post) => sum + (post.analytics?.[0]?.reach ?? 0), 0);
  const engagement = posts.reduce((sum, post) => sum + (post.analytics?.[0]?.likes ?? 0) + (post.analytics?.[0]?.comments ?? 0) + (post.analytics?.[0]?.shares ?? 0), 0);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card><p className="text-sm text-slate-500">Total reach</p><p className="text-2xl font-bold">{reach}</p></Card>
      <Card><p className="text-sm text-slate-500">Engagement</p><p className="text-2xl font-bold">{engagement}</p></Card>
      <Card><p className="text-sm text-slate-500">Posts</p><p className="text-2xl font-bold">{posts.length}</p></Card>
    </div>
  );
}
