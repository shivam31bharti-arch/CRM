import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, ExternalLink, Users } from "lucide-react";
import { CompanyArchiveButton } from "@/components/companies/CompanyArchiveButton";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const company = await db.company.findFirst({
    where: { id, archivedAt: null },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      contacts: {
        where: { status: { not: "ARCHIVED" } },
        include: { deals: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
      }
    }
  });
  if (!company) notFound();

  const canEdit = user.role !== "MEMBER" || company.ownerId === user.id;
  const deals = company.contacts.flatMap((contact) => contact.deals);
  const openDeals = deals.filter(
    (deal) => deal.stage !== "CLOSED_WON" && deal.stage !== "CLOSED_LOST"
  );
  const pipeline = openDeals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <>
      <PageHeader
        eyebrow="Company record"
        title={company.name}
        description={company.description || "Account context and related customer relationships."}
        actions={
          user.role !== "MEMBER" ? (
            <CompanyArchiveButton companyId={company.id} companyName={company.name} />
          ) : undefined
        }
      />
      <Link
        href="/companies"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to companies
      </Link>
      <WorkspaceMetrics
        className="mb-4"
        items={[
          {
            label: "Contacts",
            value: company.contacts.length,
            helper: "Active relationships",
            icon: Users,
            tone: "blue"
          },
          {
            label: "Open pipeline",
            value: currency(pipeline),
            helper: `${openDeals.length} active opportunities`,
            icon: BriefcaseBusiness,
            tone: "green"
          },
          {
            label: "Owner",
            value: company.owner?.name || "Unassigned",
            helper: "Accountability",
            icon: Building2,
            tone: "violet"
          }
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Industry</dt>
                <dd className="mt-1 text-slate-700">{company.industry || "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Website</dt>
                <dd className="mt-1 text-slate-700">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Visit website
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Phone</dt>
                <dd className="mt-1 text-slate-700">{company.phone || "Not provided"}</dd>
              </div>
            </dl>
          </Card>
          {canEdit ? (
            <CompanyForm company={company} />
          ) : (
            <Card>
              <h2 className="text-sm font-semibold text-slate-950">Company profile</h2>
              <p className="mt-1 text-xs text-slate-500">
                This company is read-only for your role. Its owner or a workspace manager can update
                the profile.
              </p>
            </Card>
          )}
        </aside>
        <Card>
          <div className="mb-4 border-b pb-3">
            <h2 className="font-semibold text-slate-950">People at this company</h2>
            <p className="mt-1 text-xs text-slate-500">
              Contacts, lifecycle stage, and active opportunity context.
            </p>
          </div>
          {company.contacts.length ? (
            <div className="divide-y divide-slate-100">
              {company.contacts.map((contact) => {
                const name = `${contact.firstName} ${contact.lastName}`;
                const contactPipeline = contact.deals
                  .filter((deal) => deal.stage !== "CLOSED_WON" && deal.stage !== "CLOSED_LOST")
                  .reduce((sum, deal) => sum + deal.value, 0);
                return (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:text-primary"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={name} src={contact.avatarUrl} className="h-9 w-9" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{name}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {contact.jobTitle || contact.email || "No role specified"}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <Badge tone={contact.status}>{contact.status.toLowerCase()}</Badge>
                      <span className="text-xs font-semibold text-slate-600">
                        {currency(contactPipeline)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No contacts linked"
              body="Choose this company when creating or editing a contact."
            />
          )}
        </Card>
      </div>
    </>
  );
}
