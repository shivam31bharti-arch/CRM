// Dashboard home page with high-level CRM and social activity summary.
import Link from "next/link";
import { BarChart3, CalendarDays, Inbox, KanbanSquare, Users } from "lucide-react";
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [contacts, deals, posts, inbox, activities] = await Promise.all([
    db.contact.count().catch(() => 0),
    db.deal.count().catch(() => 0),
    db.post.count().catch(() => 0),
    db.inboxItem.count({ where: { isRead: false } }).catch(() => 0),
    db.activity.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }).catch(() => [])
  ]);
  const cards = [
    { label: "Contacts", value: contacts, icon: Users, href: "/contacts" },
    { label: "Deals", value: deals, icon: KanbanSquare, href: "/deals" },
    { label: "Posts", value: posts, icon: CalendarDays, href: "/scheduler" },
    { label: "Unread inbox", value: inbox, icon: Inbox, href: "/inbox" }
  ];
  return (
    <>
      <PageHeader title="Dashboard" description="Your sales and social media command center." actions={<Link href="/analytics"><Button variant="secondary"><BarChart3 className="h-4 w-4" />Analytics</Button></Link>} />
      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Today</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Pipeline and publishing are ready for review.</h2>
            <p className="mt-1 text-sm text-slate-500">Seed data is loaded so every module has something realistic to inspect.</p>
          </div>
          <Link href="/scheduler/compose"><Button>Compose post</Button></Link>
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <Card className="transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-panel">
                <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">{item.label}</p>
                <p className="text-3xl font-bold">{item.value}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <Card className="mt-4">
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        <ActivityTimeline activities={activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} />
      </Card>
    </>
  );
}
