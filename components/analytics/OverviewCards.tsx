// Analytics KPI cards.
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";

export function OverviewCards() {
  const { data } = useQuery({ queryKey: ["analytics-overview"], queryFn: async () => (await fetch("/api/analytics/overview")).json() });
  const cards = [
    ["Total Posts", data?.totalPosts ?? 0],
    ["Total Reach", data?.totalReach ?? 0],
    ["Avg Engagement", `${data?.avgEngagementRate ?? 0}%`],
    ["Follower Growth", data?.followerGrowth ?? 0]
  ];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {cards.map(([label, value]) => (
        <Card key={label}>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </Card>
      ))}
    </div>
  );
}
