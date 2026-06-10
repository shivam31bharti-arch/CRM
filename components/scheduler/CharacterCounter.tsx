// Character counter with platform-specific limit warning.
import { platformLimits } from "@/lib/constants";

export function CharacterCounter({ platform, value }: { platform: keyof typeof platformLimits; value: string }) {
  const limit = platformLimits[platform];
  const remaining = limit - value.length;
  const danger = value.length / limit >= 0.9;
  return <span className={`text-xs font-medium ${danger ? "text-red-600" : "text-slate-500"}`}>{remaining} characters remaining</span>;
}
