// Team activity feed for recent CRM changes.
import { formatDistanceToNow } from "date-fns";

type Activity = { id: string; description: string; createdAt: string; user?: { name?: string | null } };

export function ActivityFeed({ items = [] }: { items?: Activity[] }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-semibold">Activity feed</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <p key={item.id} className="text-sm text-slate-700">
            <span className="font-medium">{item.user?.name ?? "System"}</span> {item.description.toLowerCase()}{" "}
            <span className="text-slate-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
