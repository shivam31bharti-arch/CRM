import Link from "next/link";
import { CalendarClock, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, currency, shortDate } from "@/lib/utils";

export type DealRow = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  closeDate?: string | null;
  contact?: { firstName: string; lastName: string } | null;
};

export function DealCard({ deal }: { deal: DealRow }) {
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="focus-ring block rounded-md border border-slate-200 bg-white p-3 shadow-card transition hover:border-primary/40 hover:shadow-panel"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-950">{deal.title}</h3>
        <Badge>{deal.probability}%</Badge>
      </div>
      <p className="mt-3 text-xl font-bold text-slate-950">{currency(deal.value, deal.currency)}</p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
        aria-label={`${deal.probability}% probability`}
      >
        <div
          className={cn(
            "h-full rounded-full",
            deal.probability >= 70
              ? "bg-emerald-500"
              : deal.probability >= 40
                ? "bg-amber-500"
                : "bg-slate-400"
          )}
          style={{ width: `${deal.probability}%` }}
        />
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          {deal.contact
            ? `${deal.contact.firstName} ${deal.contact.lastName}`
            : "No contact linked"}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          {shortDate(deal.closeDate)}
        </p>
      </div>
    </Link>
  );
}
