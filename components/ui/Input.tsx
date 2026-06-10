// Shadcn-style input primitive with consistent focus states.
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
