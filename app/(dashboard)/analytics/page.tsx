// Analytics dashboard page.
import { EngagementChart } from "@/components/analytics/EngagementChart";
import { ExportButton } from "@/components/analytics/ExportButton";
import { FollowerGrowthChart } from "@/components/analytics/FollowerGrowthChart";
import { OverviewCards } from "@/components/analytics/OverviewCards";
import { PlatformBreakdown } from "@/components/analytics/PlatformBreakdown";
import { PostPerformanceTable } from "@/components/analytics/PostPerformanceTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Track social reach, engagement, followers, and post performance." actions={<ExportButton />} />
      <div className="space-y-4">
        <OverviewCards />
        <div className="grid gap-4 lg:grid-cols-2">
          <EngagementChart />
          <FollowerGrowthChart />
          <PlatformBreakdown />
        </div>
        <PostPerformanceTable />
      </div>
    </>
  );
}
