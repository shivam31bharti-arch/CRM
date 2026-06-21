import { CircleDollarSign, Gauge, Target, Trophy } from "lucide-react";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { currency } from "@/lib/utils";
import type { DealRow } from "@/components/deals/DealCard";

export function PipelineAnalytics({ deals }: { deals: DealRow[] }) {
  const openDeals = deals.filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage));
  const openValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = openDeals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0);
  const won = deals.filter((deal) => deal.stage === "CLOSED_WON").length;
  const closed = deals.filter((deal) => ["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage)).length;
  const conversion = closed ? Math.round((won / closed) * 100) : 0;
  const avg = openDeals.length ? openValue / openDeals.length : 0;

  return (
    <WorkspaceMetrics
      className="mb-4"
      items={[
        {
          label: "Open pipeline",
          value: currency(openValue),
          helper: `${openDeals.length} opportunities`,
          icon: CircleDollarSign,
          tone: "blue"
        },
        {
          label: "Weighted forecast",
          value: currency(weighted),
          helper: "Probability adjusted",
          icon: Gauge,
          tone: "violet"
        },
        {
          label: "Average deal",
          value: currency(avg),
          helper: "Open opportunity size",
          icon: Target,
          tone: "amber"
        },
        {
          label: "Win rate",
          value: `${conversion}%`,
          helper: `${won} deals won`,
          icon: Trophy,
          tone: "green"
        }
      ]}
    />
  );
}
