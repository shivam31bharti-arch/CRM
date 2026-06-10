// Shadcn-style textarea primitive for notes, replies, and post content.
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "focus-ring min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
