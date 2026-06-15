// Reusable empty state for lists, boards, and charts.
import { Inbox } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-6 text-center">
      <Inbox className="mb-2 h-8 w-8 text-primary/70" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{body}</p>
    </div>
  );
}
