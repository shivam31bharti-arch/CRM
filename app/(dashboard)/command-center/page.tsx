import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  Lightbulb,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Target
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getRevenueCommandCenter,
  type NextBestAction,
  type RiskSignal
} from "@/lib/revenue-intelligence";

export const dynamic = "force-dynamic";

const priorityTone: Record<NextBestAction["priority"], string> = {
  Critical: "border-red-200 bg-red-50 text-red-700",
  High: "border-amber-200 bg-amber-50 text-amber-700",
  Medium: "border-blue-200 bg-blue-50 text-blue-700",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

const riskTone: Record<RiskSignal["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700"
};

const numberFormatter = new Intl.NumberFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default async function CommandCenterPage() {
  const intelligence = await getRevenueCommandCenter();
  const forecastCoverage =
    intelligence.pipeline.totalValue > 0
      ? Math.round(
          (intelligence.pipeline.weightedForecast / intelligence.pipeline.totalValue) * 100
        )
      : 0;

  return (
    <>
      <PageHeader
        title="Revenue Command Center"
        description="Prioritized relationship, pipeline, campaign, and channel signals for teams that need action instead of admin."
        actions={
          <Link href="/inbox">
            <Button>
              <RadioTower className="h-4 w-4" aria-hidden="true" />
              Triage inbox
            </Button>
          </Link>
        }
      />

      <section className="mb-4 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-panel">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Built for consumer-first revenue teams
            </div>
            <h2 className="max-w-3xl text-2xl font-bold tracking-normal md:text-4xl">
              One operating room for social demand, pipeline risk, and customer follow-up.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              The product now surfaces the revenue work that top-tier CRM suites often scatter
              across marketing, service, sales, and reporting modules.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase text-slate-300">Forecast coverage</p>
              <p className="mt-2 text-3xl font-bold">{forecastCoverage}%</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase text-slate-300">Open deals</p>
              <p className="mt-2 text-3xl font-bold">{intelligence.pipeline.openDeals}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {intelligence.metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{metric.helper}</p>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Next Best Actions</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Ranked by revenue urgency and consumer experience risk.
              </p>
            </div>
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {intelligence.nextActions.map((action) => (
              <div
                key={action.title}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className={priorityTone[action.priority]}>{action.priority}</Badge>
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      {action.impact}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-950">{action.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{action.description}</p>
                </div>
                <Link href={action.href} className="self-center">
                  <Button variant="secondary" className="w-full md:w-auto">
                    Open
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Signals</CardTitle>
              <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <div className="space-y-3">
              {intelligence.riskSignals.map((risk) => (
                <div key={risk.label} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{risk.label}</p>
                    <Badge className={riskTone[risk.tone]}>{risk.value}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{risk.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Channel ROI</CardTitle>
              <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric
                label="Impressions"
                value={numberFormatter.format(intelligence.channelRoi.impressions)}
              />
              <Metric
                label="Clicks"
                value={numberFormatter.format(intelligence.channelRoi.clicks)}
              />
              <Metric
                label="Engagements"
                value={numberFormatter.format(intelligence.channelRoi.engagements)}
              />
              <Metric
                label="Active campaigns"
                value={numberFormatter.format(intelligence.channelRoi.activeCampaigns)}
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {intelligence.strategicGaps.map((gap) => (
          <Card key={gap.title}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <Lightbulb className="h-5 w-5 text-accent" aria-hidden="true" />
              <Badge className={gap.status === "Covered" ? riskTone.emerald : riskTone.blue}>
                {gap.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-slate-950">{gap.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{gap.unmetNeed}</p>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-800">{gap.solution}</p>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Forecast Snapshot</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Total open value"
              value={moneyFormatter.format(intelligence.pipeline.totalValue)}
            />
            <Metric
              label="Weighted forecast"
              value={moneyFormatter.format(intelligence.pipeline.weightedForecast)}
            />
            <Metric
              label="Overdue deals"
              value={numberFormatter.format(intelligence.pipeline.overdueDeals)}
            />
            <Metric
              label="Closing in 7 days"
              value={numberFormatter.format(intelligence.pipeline.closingSoonDeals)}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consumer Promise</CardTitle>
            {intelligence.riskSignals.some(
              (risk) => risk.tone === "red" || risk.tone === "amber"
            ) ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            )}
          </CardHeader>
          <p className="text-sm leading-6 text-slate-500">
            Every consumer signal should become one of three things: a fast reply, a CRM owner, or a
            measurable campaign touch. This view keeps those promises visible without requiring a
            separate enterprise admin workflow.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/contacts">
              <Button variant="secondary">Review contacts</Button>
            </Link>
            <Link href="/campaigns">
              <Button variant="secondary">Review campaigns</Button>
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
