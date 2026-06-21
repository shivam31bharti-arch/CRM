import { CalendarClock, CircleDollarSign, Gauge, UserRound } from "lucide-react";
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency, shortDate } from "@/lib/utils";

type DealDetailProps = {
  deal: {
    title: string;
    value: number;
    currency: string;
    stage: string;
    probability: number;
    closeDate?: Date | null;
    description?: string | null;
    contact?: { firstName: string; lastName: string } | null;
    activities: Array<{
      id: string;
      type: string;
      description: string;
      createdAt: Date;
      user?: { name?: string | null };
    }>;
  };
};

export function DealDetail({ deal }: DealDetailProps) {
  const weighted = deal.value * (deal.probability / 100);
  return (
    <div className="space-y-4">
      <WorkspaceMetrics
        items={[
          {
            label: "Deal value",
            value: currency(deal.value, deal.currency),
            helper: "Total opportunity",
            icon: CircleDollarSign,
            tone: "blue"
          },
          {
            label: "Weighted value",
            value: currency(weighted, deal.currency),
            helper: "Forecast contribution",
            icon: Gauge,
            tone: "violet"
          },
          {
            label: "Probability",
            value: deal.probability + "%",
            helper: "Close confidence",
            icon: Gauge,
            tone: "green"
          },
          {
            label: "Close date",
            value: shortDate(deal.closeDate),
            helper: "Target timing",
            icon: CalendarClock,
            tone: "amber"
          }
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="self-start">
          <div className="flex items-center justify-between">
            <Badge tone={deal.stage}>{deal.stage.replaceAll("_", " ").toLowerCase()}</Badge>
            <span className="text-xs font-semibold text-slate-400">Opportunity</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {currency(deal.value, deal.currency)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: deal.probability + "%" }}
            />
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Contact</dt>
              <dd className="mt-1 flex items-center gap-2 text-slate-700">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {deal.contact
                  ? deal.contact.firstName + " " + deal.contact.lastName
                  : "No contact linked"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Description</dt>
              <dd className="mt-1 leading-6 text-slate-600">
                {deal.description ?? "No opportunity notes yet."}
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <div className="mb-4 border-b pb-3">
            <h2 className="font-semibold text-slate-950">Deal activity</h2>
            <p className="mt-1 text-xs text-slate-500">Stage changes and customer interactions.</p>
          </div>
          <ActivityTimeline
            activities={deal.activities.map((activity) => ({
              ...activity,
              createdAt: activity.createdAt.toISOString()
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
