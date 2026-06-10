// Deal card for the pipeline board.
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { currency, shortDate } from "@/lib/utils";

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
    <Link href={`/deals/${deal.id}`} className="block rounded-md border bg-white p-3 shadow-card hover:border-blue-300">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-950">{deal.title}</h3>
        <Badge>{deal.probability}%</Badge>
      </div>
      <p className="mt-2 text-lg font-bold">{currency(deal.value, deal.currency)}</p>
      <p className="mt-1 text-xs text-slate-500">
        {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : "No contact"} · {shortDate(deal.closeDate)}
      </p>
    </Link>
  );
}
