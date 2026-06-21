// Scheduled post card for calendar and agenda views.
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, shortDate } from "@/lib/utils";

export type PostRow = {
  id: string;
  body: string;
  platform: string;
  status: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
};

const platformAccent: Record<string, string> = {
  TWITTER: "border-l-sky-500",
  LINKEDIN: "border-l-blue-700",
  INSTAGRAM: "border-l-fuchsia-500",
  FACEBOOK: "border-l-indigo-600"
};

export function PostCard({ post, compact = false }: { post: PostRow; compact?: boolean }) {
  return (
    <article
      className={cn(
        "rounded-md border border-l-4 bg-white p-3 text-sm shadow-sm",
        platformAccent[post.platform] ?? "border-l-slate-400",
        compact && "shadow-none"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge>
          {post.platform === "TWITTER"
            ? "X / Twitter"
            : post.platform[0] + post.platform.slice(1).toLowerCase()}
        </Badge>
        <Badge tone={post.status}>{post.status.toLowerCase()}</Badge>
      </div>
      <p className="line-clamp-3 text-slate-700">{post.body}</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {shortDate(post.scheduledAt ?? post.publishedAt)}
      </p>
    </article>
  );
}
