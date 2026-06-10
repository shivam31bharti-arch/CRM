// Reverse-chronological activity timeline for contacts and deals.
import { formatDistanceToNow } from "date-fns";

type Activity = { id: string; description: string; type: string; createdAt: string; user?: { name?: string | null } };

export function ActivityTimeline({ activities = [] }: { activities?: Activity[] }) {
  return (
    <ol className="space-y-3">
      {activities.length === 0 ? (
        <li className="text-sm text-slate-500">No activity yet.</li>
      ) : (
        activities.map((activity) => (
          <li key={activity.id} className="rounded-md border bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{activity.description}</span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {activity.type.replaceAll("_", " ")} by {activity.user?.name ?? "System"}
            </p>
          </li>
        ))
      )}
    </ol>
  );
}
