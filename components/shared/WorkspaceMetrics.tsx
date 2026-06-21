import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type WorkspaceMetric = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone?: "slate" | "red" | "blue" | "green" | "amber" | "violet";
};

const toneStyles = {
  slate: "bg-slate-100 text-slate-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700"
};

export function WorkspaceMetrics({
  items,
  className
}: {
  items: WorkspaceMetric[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map(({ label, value, helper, icon: Icon, tone = "slate" }) => (
        <Card key={label} className="flex items-center gap-3 p-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              toneStyles[tone]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-slate-950">{value}</p>
              <p className="truncate text-xs text-slate-500">{helper}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
