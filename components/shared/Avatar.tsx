// Avatar component with deterministic initials fallback.
import { cn } from "@/lib/utils";

export function Avatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  const initials =
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  if (src) {
    return (
      <span
        aria-label={name ?? "Avatar"}
        role="img"
        className={cn("inline-flex h-9 w-9 rounded-full bg-cover bg-center", className)}
        style={{ backgroundImage: `url(${src})` }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700",
        className
      )}
    >
      {initials}
    </span>
  );
}
