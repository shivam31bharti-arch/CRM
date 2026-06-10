// Contact detail page with fields, associations, and activity timeline.
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
import { TagBadge } from "@/components/contacts/TagBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { Card } from "@/components/ui/Card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const contact = await db.contact.findUnique({
    where: { id: params.id },
    include: { tags: true, deals: true, activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } } }
  });
  if (!contact) return <PageHeader title="Contact not found" />;
  const name = `${contact.firstName} ${contact.lastName}`;
  return (
    <>
      <PageHeader title={name} description={contact.company ?? "Individual contact"} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <Avatar name={name} src={contact.avatarUrl} className="h-16 w-16" />
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-medium">Email</dt><dd className="text-slate-600">{contact.email ?? "None"}</dd></div>
            <div><dt className="font-medium">Phone</dt><dd className="text-slate-600">{contact.phone ?? "None"}</dd></div>
            <div><dt className="font-medium">Status</dt><dd className="text-slate-600">{contact.status}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">{contact.tags.map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} />)}</div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Activity timeline</h2>
          <ActivityTimeline activities={contact.activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} />
        </Card>
      </div>
    </>
  );
}
