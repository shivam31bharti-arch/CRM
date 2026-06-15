// Shadcn-style button primitive used across the application.
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-primary text-primary-foreground hover:bg-red-700",
      secondary: "border bg-white text-slate-900 hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100",
      danger: "bg-destructive text-destructive-foreground hover:bg-red-700"
    };
    return (
      <button
        ref={ref}
        className={cn(
          "focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
