// Scheduled post card for calendar and list views.
import { Badge } from "@/components/ui/Badge";
import { shortDate } from "@/lib/utils";

export type PostRow = {
  id: string;
  body: string;
  platform: string;
  status: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
};

export function PostCard({ post }: { post: PostRow }) {
  return (
    <article className="rounded-md border bg-white p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge>{post.platform}</Badge>
        <Badge tone={post.status}>{post.status}</Badge>
      </div>
      <p className="line-clamp-3 text-slate-700">{post.body}</p>
      <p className="mt-2 text-xs text-slate-500">{shortDate(post.scheduledAt ?? post.publishedAt)}</p>
    </article>
  );
}
