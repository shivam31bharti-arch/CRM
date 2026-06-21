import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Mail, Phone, Target, UserCheck } from "lucide-react";
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
import { TagBadge } from "@/components/contacts/TagBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { currency } from "@/lib/utils";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await db.contact.findUnique({
    where: { id },
    include: {
      tags: true,
      deals: true,
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }
    }
  });
  if (!contact) return <PageHeader title="Contact not found" />;
  const name = contact.firstName + " " + contact.lastName;
  const pipeline = contact.deals
    .filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage))
    .reduce((sum, deal) => sum + deal.value, 0);
  return (
    <>
      <PageHeader
        eyebrow="Customer record"
        title={name}
        description={
          [contact.jobTitle, contact.company].filter(Boolean).join(" at ") || "Individual contact"
        }
        actions={
          <div className="flex gap-2">
            {contact.email ? (
              <a
                href={"mailto:" + contact.email}
                className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
              </a>
            ) : null}
            {contact.phone ? (
              <a
                href={"tel:" + contact.phone}
                className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
            ) : null}
          </div>
        }
      />
      <Link
        href="/contacts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Customer Hub
      </Link>
      <WorkspaceMetrics
        className="mb-4"
        items={[
          {
            label: "Lifecycle",
            value: contact.status.toLowerCase(),
            helper: "Current status",
            icon: UserCheck,
            tone: "green"
          },
          {
            label: "Open pipeline",
            value: currency(pipeline),
            helper: "Associated value",
            icon: Target,
            tone: "blue"
          },
          {
            label: "Deals",
            value: contact.deals.length,
            helper: "Linked opportunities",
            icon: BriefcaseBusiness,
            tone: "violet"
          },
          {
            label: "Activities",
            value: contact.activities.length,
            helper: "Recorded touchpoints",
            icon: Phone,
            tone: "amber"
          }
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={name} src={contact.avatarUrl} className="h-16 w-16" />
              <div>
                <h2 className="font-semibold text-slate-950">{name}</h2>
                <Badge tone={contact.status}>{contact.status.toLowerCase()}</Badge>
              </div>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Email</dt>
                <dd className="mt-1 text-slate-700">{contact.email ?? "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Phone</dt>
                <dd className="mt-1 text-slate-700">{contact.phone ?? "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Company</dt>
                <dd className="mt-1 text-slate-700">{contact.company ?? "Independent"}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-slate-950">Associated deals</h2>
            <div className="mt-3 space-y-2">
              {contact.deals.length ? (
                contact.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={"/deals/" + deal.id}
                    className="block rounded-md border p-3 transition hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {deal.title}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {currency(deal.value, deal.currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {deal.stage.replaceAll("_", " ").toLowerCase()}
                    </p>
                  </Link>
                ))
              ) : (
                <EmptyState
                  compact
                  icon={BriefcaseBusiness}
                  title="No deals linked"
                  body="Create an opportunity from the pipeline."
                />
              )}
            </div>
          </Card>
        </aside>
        <Card>
          <div className="mb-4 border-b pb-3">
            <h2 className="font-semibold text-slate-950">Relationship timeline</h2>
            <p className="mt-1 text-xs text-slate-500">
              Every meaningful touchpoint in one chronological view.
            </p>
          </div>
          <ActivityTimeline
            activities={contact.activities.map((activity) => ({
              ...activity,
              createdAt: activity.createdAt.toISOString()
            }))}
          />
        </Card>
      </div>
    </>
  );
}
