// Drag-and-drop deal pipeline board with optimistic stage updates.
"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dealStages } from "@/lib/constants";
import { StageColumn } from "@/components/deals/StageColumn";
import { PipelineAnalytics } from "@/components/deals/PipelineAnalytics";
import type { DealRow } from "@/components/deals/DealCard";
import { LoadingState } from "@/components/shared/LoadingState";

export function PipelineBoard() {
  const client = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["deals"], queryFn: async () => (await fetch("/api/deals")).json() });
  const deals: DealRow[] = data?.items ?? [];
  async function onDragEnd(event: DragEndEvent) {
    const dealId = String(event.active.id);
    const stage = String(event.over?.id ?? "");
    if (!dealId || !dealStages.includes(stage as never)) return;
    const previous = client.getQueryData(["deals"]);
    client.setQueryData(["deals"], { items: deals.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal)) });
    const response = await fetch(`/api/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, lostReason: stage === "CLOSED_LOST" ? "Marked lost from board" : undefined })
    });
    if (!response.ok) client.setQueryData(["deals"], previous);
  }
  if (isLoading) return <LoadingState rows={6} />;
  return (
    <>
      <PipelineAnalytics deals={deals} />
      <DndContext onDragEnd={onDragEnd}>
        <div className="grid gap-3 overflow-x-auto lg:grid-cols-6">
          {dealStages.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              deals={deals.filter((deal) => deal.stage === stage).map((deal) => ({ ...deal, id: deal.id }))}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
