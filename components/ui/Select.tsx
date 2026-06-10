// Native select primitive styled to match the local component system.
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("focus-ring h-9 w-full rounded-md border bg-white px-3 text-sm", className)}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = "Select";
