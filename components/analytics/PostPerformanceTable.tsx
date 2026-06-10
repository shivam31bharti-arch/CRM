// Sortable post performance table with pagination-ready rows.
"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";

type Row = { id: string; platform: string; body: string; likes: number; comments: number; shares: number; reach: number; impressions: number };

export function PostPerformanceTable() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics-posts"], queryFn: async () => (await fetch("/api/analytics/posts")).json() });
  if (isLoading) return <LoadingState rows={4} />;
  return (
    <DataTable<Row>
      rows={data?.items ?? []}
      columns={[
        { key: "platform", header: "Platform", sortable: true },
        { key: "body", header: "Post", render: (row) => row.body.slice(0, 80) },
        { key: "likes", header: "Likes", sortable: true },
        { key: "comments", header: "Comments", sortable: true },
        { key: "shares", header: "Shares", sortable: true },
        { key: "reach", header: "Reach", sortable: true },
        { key: "impressions", header: "Impressions", sortable: true }
      ]}
    />
  );
}
