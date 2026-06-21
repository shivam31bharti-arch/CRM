import { platforms } from "@/lib/constants";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  TWITTER: "bg-sky-500",
  LINKEDIN: "bg-blue-700",
  INSTAGRAM: "bg-fuchsia-500",
  FACEBOOK: "bg-indigo-600"
};

export function PlatformSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      role="radiogroup"
      aria-label="Social platform"
    >
      {platforms.map((platform) => {
        const label =
          platform === "TWITTER" ? "X / Twitter" : platform[0] + platform.slice(1).toLowerCase();
        return (
          <button
            key={platform}
            type="button"
            role="radio"
            aria-checked={value === platform}
            onClick={() => onChange(platform)}
            className={cn(
              "focus-ring flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50",
              value === platform && "border-slate-950 bg-slate-950 text-white hover:bg-slate-900"
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", styles[platform])} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
