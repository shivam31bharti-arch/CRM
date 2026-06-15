// Shared Kai & Co. brand lockup.
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-xl font-bold text-primary-foreground shadow-sm">
        K
      </div>
      {!compact ? (
        <div>
          <p className="text-lg font-bold leading-tight">Kai &amp; Co.</p>
          <p className="text-xs text-slate-500">Internal CRM</p>
        </div>
      ) : null}
    </div>
  );
}
