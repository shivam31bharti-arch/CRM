// Pipeline analytics summary for conversion, average size, and total value.
import { Card } from "@/components/ui/Card";
import { currency } from "@/lib/utils";
import type { DealRow } from "@/components/deals/DealCard";

export function PipelineAnalytics({ deals }: { deals: DealRow[] }) {
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);
  const won = deals.filter((deal) => deal.stage === "CLOSED_WON").length;
  const conversion = deals.length ? Math.round((won / deals.length) * 100) : 0;
  const avg = deals.length ? total / deals.length : 0;
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <Card><p className="text-sm text-slate-500">Pipeline value</p><p className="mt-1 text-2xl font-bold">{currency(total)}</p></Card>
      <Card><p className="text-sm text-slate-500">Average deal</p><p className="mt-1 text-2xl font-bold">{currency(avg)}</p></Card>
      <Card><p className="text-sm text-slate-500">Conversion rate</p><p className="mt-1 text-2xl font-bold">{conversion}%</p></Card>
    </div>
  );
}
