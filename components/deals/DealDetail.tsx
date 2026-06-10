// Deal detail panel with linked contact and timeline fields.
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
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
    activities: Array<{ id: string; type: string; description: string; createdAt: Date; user?: { name?: string | null } }>;
  };
};

export function DealDetail({ deal }: DealDetailProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <Badge tone={deal.stage}>{deal.stage}</Badge>
        <p className="mt-4 text-3xl font-bold">{currency(deal.value, deal.currency)}</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="font-medium">Probability</dt><dd>{deal.probability}%</dd></div>
          <div><dt className="font-medium">Close date</dt><dd>{shortDate(deal.closeDate)}</dd></div>
          <div><dt className="font-medium">Contact</dt><dd>{deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : "None"}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Activity timeline</h2>
        <ActivityTimeline activities={deal.activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} />
      </Card>
    </div>
  );
}
