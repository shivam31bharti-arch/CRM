"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { DealRow } from "@/components/deals/DealCard";
import { PipelineAnalytics } from "@/components/deals/PipelineAnalytics";
import { StageColumn } from "@/components/deals/StageColumn";
import { LoadingState } from "@/components/shared/LoadingState";
import { Input } from "@/components/ui/Input";
import { dealStages } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EMPTY_DEALS: DealRow[] = [];

export function PipelineBoard() {
  const [view, setView] = useState<"OPEN" | "ALL">("OPEN");
  const [search, setSearch] = useState("");
  const client = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => (await fetch("/api/deals")).json()
  });
  const deals: DealRow[] = data?.items ?? EMPTY_DEALS;
  const visibleDeals = deals.filter((deal) =>
    deal.title.toLowerCase().includes(search.toLowerCase())
  );
  const visibleStages = view === "OPEN" ? dealStages.slice(0, 4) : dealStages;

  async function onDragEnd(event: DragEndEvent) {
    const dealId = String(event.active.id);
    const stage = String(event.over?.id ?? "");
    if (!dealId || !dealStages.includes(stage as never)) return;
    const previous = client.getQueryData(["deals"]);
    client.setQueryData(["deals"], {
      items: deals.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal))
    });
    const response = await fetch(`/api/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        lostReason: stage === "CLOSED_LOST" ? "Marked lost from board" : undefined
      })
    });
    if (!response.ok) client.setQueryData(["deals"], previous);
  }

  if (isLoading) return <LoadingState rows={6} />;
  return (
    <>
      <PipelineAnalytics deals={deals} />
      <div className="mb-4 flex flex-col gap-3 border-y border-slate-200 bg-white/60 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search deals</span>
          <Search
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder="Search opportunities"
          />
        </label>
        <div
          className="flex h-9 items-center rounded-md border bg-white p-1"
          aria-label="Pipeline view"
        >
          {(["OPEN", "ALL"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={cn(
                "focus-ring h-7 rounded px-3 text-xs font-semibold",
                view === item ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {item === "OPEN" ? "Open pipeline" : "All stages"}
            </button>
          ))}
        </div>
      </div>
      <DndContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {visibleStages.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              deals={visibleDeals.filter((deal) => deal.stage === stage)}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
