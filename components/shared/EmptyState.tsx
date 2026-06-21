import Link from "next/link";
import { ArrowUpRight, Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  body,
  action,
  href,
  icon: Icon = Inbox,
  compact = false
}: {
  title: string;
  body: string;
  action?: string;
  href?: string;
  icon?: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex min-h-28 flex-col items-center justify-center rounded-md border border-dashed bg-white p-4 text-center"
          : "flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-6 text-center"
      }
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{body}</p>
      {action && href ? (
        <Link href={href} className="mt-4">
          <Button variant="secondary">
            {action}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
