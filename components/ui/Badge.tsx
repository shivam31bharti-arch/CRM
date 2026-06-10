// Badge primitive for statuses, platforms, roles, and tags.
import { cn } from "@/lib/utils";
import { statusColors } from "@/lib/constants";

export function Badge({ children, className, tone }: { children: React.ReactNode; className?: string; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        tone ? statusColors[tone] ?? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-100 text-slate-700",
        className
      )}
    >
      {children}
    </span>
  );
}
