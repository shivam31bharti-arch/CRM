"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  ArrowUpRight,
  BarChart3,
  Eye,
  Heart,
  Lightbulb,
  MessageCircle,
  MousePointerClick,
  Send,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { ExportButton } from "@/components/analytics/ExportButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

type Period = 7 | 30 | 90;
type Metric = "reach" | "impressions" | "engagement";

type AnalyticsOverview = {
  totalPosts: number;
  totalReach: number;
  avgEngagementRate: number;
  followerGrowth: number;
};

type PerformanceRow = {
  id: string;
  platform: string;
  body: string;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
  impressions: number;
  recordedAt: string;
};

const EMPTY_ROWS: PerformanceRow[] = [];

const metricConfig = {
  reach: { label: "Reach", color: "#e4493e" },
  impressions: { label: "Impressions", color: "#2563eb" },
  engagement: { label: "Engagement", color: "#059669" }
} as const;

const platformColors: Record<string, string> = {
  TWITTER: "#0ea5e9",
  LINKEDIN: "#2563eb",
  INSTAGRAM: "#d946ef",
  FACEBOOK: "#4f46e5"
};

const platformNames: Record<string, string> = {
  TWITTER: "X / Twitter",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook"
};

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>(30);
  const [platform, setPlatform] = useState("ALL");
  const [metric, setMetric] = useState<Metric>("reach");
  const from = useMemo(() => subDays(new Date(), period).toISOString(), [period]);

  const overviewQuery = useQuery<AnalyticsOverview>({
    queryKey: ["analytics-overview", period],
    queryFn: async () =>
      (await fetch(`/api/analytics/overview?from=${encodeURIComponent(from)}`)).json()
  });
  const postsQuery = useQuery<{ items: PerformanceRow[] }>({
    queryKey: ["analytics-posts", period],
    queryFn: async () =>
      (await fetch(`/api/analytics/posts?from=${encodeURIComponent(from)}`)).json()
  });

  const allRows = postsQuery.data?.items ?? EMPTY_ROWS;
  const rows = platform === "ALL" ? allRows : allRows.filter((row) => row.platform === platform);
  const overview = overviewQuery.data;

  const trendData = useMemo(() => {
    const points = Array.from({ length: period }, (_, index) => {
      const date = subDays(new Date(), period - index - 1);
      return {
        key: format(date, "yyyy-MM-dd"),
        date: format(date, period === 7 ? "EEE" : "MMM d"),
        reach: 0,
        impressions: 0,
        engagement: 0
      };
    });
    const byDate = new Map(points.map((point) => [point.key, point]));
    for (const row of rows) {
      const point = byDate.get(format(new Date(row.recordedAt), "yyyy-MM-dd"));
      if (!point) continue;
      point.reach += row.reach;
      point.impressions += row.impressions;
      point.engagement += row.likes + row.comments + row.shares;
    }
    return points;
  }, [period, rows]);

  const platformData = useMemo(
    () =>
      Object.keys(platformNames).map((key) => {
        const platformRows = allRows.filter((row) => row.platform === key);
        return {
          platform: platformNames[key],
          key,
          reach: platformRows.reduce((sum, row) => sum + row.reach, 0),
          engagement: platformRows.reduce(
            (sum, row) => sum + row.likes + row.comments + row.shares,
            0
          )
        };
      }),
    [allRows]
  );

  const rankedRows = useMemo(
    () => [...rows].sort((a, b) => b.reach + b.clicks * 5 - (a.reach + a.clicks * 5)),
    [rows]
  );
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalEngagement = rows.reduce((sum, row) => sum + row.likes + row.comments + row.shares, 0);
  const bestPlatform = [...platformData].sort((a, b) => b.reach - a.reach)[0];
  const hasData = allRows.some(
    (row) => row.impressions || row.reach || row.likes || row.comments || row.shares
  );

  if (overviewQuery.isLoading || postsQuery.isLoading) return <LoadingState rows={7} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-y border-slate-200 bg-white/60 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex h-9 items-center rounded-md border bg-white p-1"
            aria-label="Analytics period"
          >
            {([7, 30, 90] as const).map((days) => (
              <button
                type="button"
                key={days}
                onClick={() => setPeriod(days)}
                className={cn(
                  "focus-ring h-7 rounded px-3 text-xs font-semibold transition",
                  period === days ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {days}D
              </button>
            ))}
          </div>
          <Select
            className="w-40"
            aria-label="Filter analytics by platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            <option value="ALL">All platforms</option>
            {Object.entries(platformNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <span className="text-xs text-slate-500">Updated from live post analytics</span>
        </div>
        <ExportButton />
      </div>

      <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-panel">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-red-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Performance pulse
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              {hasData
                ? `${bestPlatform?.platform ?? "Your content"} is carrying the strongest reach.`
                : "Your measurement workspace is ready."}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
              {hasData
                ? `${totalEngagement.toLocaleString()} meaningful interactions and ${totalClicks.toLocaleString()} tracked clicks in the selected window.`
                : "Publish content or connect a social account to turn this space into live recommendations."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/scheduler/compose">
              <Button className="bg-white text-slate-950 hover:bg-slate-100">
                <Send className="h-4 w-4" aria-hidden="true" />
                Create post
              </Button>
            </Link>
            {!hasData ? (
              <Link href="/settings/integrations">
                <Button className="border border-slate-700 bg-transparent hover:bg-slate-800">
                  Connect channel
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Send}
          label="Posts published"
          value={overview?.totalPosts ?? 0}
          helper={`Last ${period} days`}
          tone="slate"
        />
        <MetricCard
          icon={Eye}
          label="Total reach"
          value={(overview?.totalReach ?? 0).toLocaleString()}
          helper="Unique audience"
          tone="red"
        />
        <MetricCard
          icon={Heart}
          label="Engagement rate"
          value={`${overview?.avgEngagementRate ?? 0}%`}
          helper={`${totalEngagement.toLocaleString()} interactions`}
          tone="green"
        />
        <MetricCard
          icon={Users}
          label="Follower signal"
          value={(overview?.followerGrowth ?? 0).toLocaleString()}
          helper="Across connected channels"
          tone="blue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <Card className="min-h-[390px] p-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Performance movement</h2>
              <p className="mt-1 text-xs text-slate-500">
                See what is moving, then focus the chart by signal.
              </p>
            </div>
            <div className="flex items-center rounded-md bg-slate-100 p-1">
              {(Object.keys(metricConfig) as Metric[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setMetric(item)}
                  className={cn(
                    "focus-ring rounded px-3 py-1.5 text-xs font-semibold",
                    metric === item
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {metricConfig[item].label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] px-2 pb-3 pt-5 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricConfig[metric].color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={metricConfig[metric].color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  interval={period === 90 ? 14 : period === 30 ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, .12)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={metricConfig[metric].color}
                  strokeWidth={2.5}
                  fill="url(#metricFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b p-4">
            <h2 className="text-base font-semibold text-slate-950">Channel comparison</h2>
            <p className="mt-1 text-xs text-slate-500">Reach and interaction by network.</p>
          </div>
          <div className="h-56 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={platformData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="platform"
                  type="category"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="reach" radius={[0, 4, 4, 0]}>
                  {platformData.map((entry) => (
                    <Cell key={entry.key} fill={platformColors[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 border-t p-4">
            <InsightRow
              icon={TrendingUp}
              label="Strongest channel"
              value={hasData ? (bestPlatform?.platform ?? "No data") : "Awaiting data"}
            />
            <InsightRow
              icon={MousePointerClick}
              label="Tracked clicks"
              value={totalClicks.toLocaleString()}
            />
            <InsightRow
              icon={MessageCircle}
              label="Interactions"
              value={totalEngagement.toLocaleString()}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Content leaderboard</h2>
              <p className="mt-1 text-xs text-slate-500">Ranked by reach and high-intent clicks.</p>
            </div>
            <Badge>{rows.length} posts</Badge>
          </div>
          {rankedRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Post</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3 text-right">Reach</th>
                    <th className="px-4 py-3 text-right">Engagement</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedRows.slice(0, 6).map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="max-w-md px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <span className="truncate text-slate-700">{row.body}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge>{platformNames[row.platform] ?? row.platform}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {row.reach.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {(row.likes + row.comments + row.shares).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
              <BarChart3 className="h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-900">No posts in this view</p>
              <p className="mt-1 text-xs text-slate-500">
                Try another range or publish your first post.
              </p>
            </div>
          )}
        </Card>

        <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-900">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Next best moves</h2>
          </div>
          <div className="mt-4 space-y-4">
            <Recommendation
              number="01"
              title={hasData ? "Repeat the strongest format" : "Connect your first channel"}
              body={
                hasData
                  ? `Use the hook and format from your top ${bestPlatform?.platform ?? "channel"} post in the next campaign.`
                  : "Bring one social account online to unlock channel-level recommendations."
              }
            />
            <Recommendation
              number="02"
              title={period < 90 ? "Widen the learning window" : "Review the current window"}
              body={
                period < 90
                  ? "Switch to 90 days to distinguish repeatable patterns from short spikes."
                  : "Compare high-reach posts with click performance before repeating them."
              }
            />
            <Recommendation
              number="03"
              title="Tie attention to pipeline"
              body="Attach posts to campaigns so clicks, contacts, and revenue can be reviewed together."
            />
          </div>
          <Link
            href="/campaigns"
            className="mt-5 flex items-center justify-between border-t border-amber-200 pt-4 text-sm font-semibold text-amber-950"
          >
            Open campaigns
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
  helper: string;
  tone: "slate" | "red" | "green" | "blue";
}) {
  const styles = {
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700"
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", styles[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Recommendation({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-bold text-amber-700">{number}</span>
      <div>
        <p className="text-sm font-semibold text-amber-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-amber-900/70">{body}</p>
      </div>
    </div>
  );
}
