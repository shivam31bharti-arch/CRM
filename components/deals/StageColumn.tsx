// Pipeline stage column with total value and empty state.
"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DealCard, type DealRow } from "@/components/deals/DealCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { currency } from "@/lib/utils";

export function StageColumn({ stage, deals }: { stage: string; deals: DealRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);
  return (
    <section ref={setNodeRef} className={`min-h-96 rounded-lg border bg-slate-50 p-3 ${isOver ? "ring-2 ring-blue-500" : ""}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{stage.replaceAll("_", " ")}</h2>
        <span className="text-xs font-medium text-slate-500">{currency(total)}</span>
      </div>
      <div className="space-y-3">
        {deals.length ? deals.map((deal) => <DraggableDeal key={deal.id} deal={deal} />) : <EmptyState title="No deals" body="Drop deals here as the stage changes." />}
      </div>
    </section>
  );
}

function DraggableDeal({ deal }: { deal: DealRow }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: deal.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} />
    </div>
  );
}
