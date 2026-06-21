// Interactive analytics command surface.
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics Pulse"
        description="Find the content signals worth repeating and turn attention into measurable pipeline."
      />
      <AnalyticsDashboard />
    </>
  );
}
