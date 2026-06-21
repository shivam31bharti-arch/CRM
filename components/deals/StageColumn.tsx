"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { BriefcaseBusiness } from "lucide-react";
import { DealCard, type DealRow } from "@/components/deals/DealCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, currency } from "@/lib/utils";

export function StageColumn({ stage, deals }: { stage: string; deals: DealRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, deal) => sum + deal.value, 0);
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "min-h-[430px] w-72 shrink-0 rounded-lg border border-slate-200 bg-slate-100/70 p-3 transition",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase text-slate-700">
            {stage.replaceAll("_", " ")}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{deals.length} opportunities</p>
        </div>
        <span className="text-xs font-bold text-slate-700">{currency(total)}</span>
      </div>
      <div className="space-y-3">
        {deals.length ? (
          deals.map((deal) => <DraggableDeal key={deal.id} deal={deal} />)
        ) : (
          <EmptyState
            compact
            icon={BriefcaseBusiness}
            title="Stage is clear"
            body="Drop an opportunity here."
          />
        )}
      </div>
    </section>
  );
}

function DraggableDeal({ deal }: { deal: DealRow }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: deal.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} />
    </div>
  );
}
