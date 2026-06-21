// Dashboard home page with high-level CRM and social activity summary.
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Inbox,
  KanbanSquare,
  Sparkles,
  Target,
  Users
} from "lucide-react";
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { getRevenueCommandCenter } from "@/lib/revenue-intelligence";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [contacts, deals, posts, inbox, activities, intelligence] = await Promise.all([
    db.contact.count().catch(() => 0),
    db.deal.count().catch(() => 0),
    db.post.count().catch(() => 0),
    db.inboxItem.count({ where: { isRead: false } }).catch(() => 0),
    db.activity
      .findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10
      })
      .catch(() => []),
    getRevenueCommandCenter()
  ]);
  const cards = [
    { label: "Contacts", value: contacts, icon: Users, href: "/contacts" },
    { label: "Deals", value: deals, icon: KanbanSquare, href: "/deals" },
    { label: "Posts", value: posts, icon: CalendarDays, href: "/scheduler" },
    { label: "Unread inbox", value: inbox, icon: Inbox, href: "/inbox" }
  ];
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Client relationships, deals, campaigns, and team activity in one place."
        actions={
          <>
            <Link href="/command-center">
              <Button>
                <Sparkles className="h-4 w-4" />
                Command Center
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="secondary">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
          </>
        }
      />
      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Today</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Kai &amp; Co. workspace is ready for revenue review.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track relationships, opportunities, scheduled work, customer follow-up, and the next
              best action.
            </p>
          </div>
          <Link href="/scheduler/compose">
            <Button>Compose post</Button>
          </Link>
        </div>
      </section>
      <section className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-panel">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-300" aria-hidden="true" />
            <h2 className="font-semibold">Today&apos;s Revenue Priorities</h2>
          </div>
          <div className="space-y-3">
            {intelligence.nextActions.slice(0, 3).map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/10 p-3 transition hover:bg-white/15"
              >
                <div>
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{action.impact}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {intelligence.metrics.slice(0, 4).map((metric) => (
            <Card key={metric.label}>
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{metric.helper}</p>
            </Card>
          ))}
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <Card className="transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-panel">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">{item.label}</p>
                <p className="text-3xl font-bold">{item.value}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <Card className="mt-4">
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        <ActivityTimeline
          activities={activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        />
      </Card>
    </>
  );
}
