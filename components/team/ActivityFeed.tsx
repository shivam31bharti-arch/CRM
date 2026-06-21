import { formatDistanceToNow } from "date-fns";
import { Activity, Clock3 } from "lucide-react";

type ActivityRow = {
  id: string;
  description: string;
  createdAt: string;
  user?: { name?: string | null };
};

export function ActivityFeed({ items = [] }: { items?: ActivityRow[] }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-card">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Activity stream</h2>
          <p className="text-xs text-slate-500">Recent work across the CRM.</p>
        </div>
        <Activity className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      <ol className="mt-4 space-y-4">
        {items.length ? (
          items.map((item) => (
            <li key={item.id} className="relative flex gap-3 pl-1">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">
                    {item.user?.name ?? "System"}
                  </span>{" "}
                  {item.description.toLowerCase()}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))
        ) : (
          <li className="flex min-h-32 flex-col items-center justify-center text-center">
            <Activity className="h-7 w-7 text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-800">No activity yet</p>
            <p className="mt-1 text-xs text-slate-500">Team actions will appear here.</p>
          </li>
        )}
      </ol>
    </section>
  );
}
