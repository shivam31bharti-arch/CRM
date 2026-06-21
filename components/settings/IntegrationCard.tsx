"use client";

import { PlugZap, Radio, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const platformStyles: Record<string, string> = {
  TWITTER: "bg-sky-50 text-sky-700",
  LINKEDIN: "bg-blue-50 text-blue-700",
  INSTAGRAM: "bg-fuchsia-50 text-fuchsia-700",
  FACEBOOK: "bg-indigo-50 text-indigo-700"
};

export function IntegrationCard({
  platform,
  account,
  onChanged
}: {
  platform: string;
  account?: { accountName: string; followerCount?: number | null; isActive: boolean } | null;
  onChanged?: () => void;
}) {
  function connect() {
    window.location.href = "/api/social-accounts/connect?platform=" + encodeURIComponent(platform);
  }
  async function disconnect() {
    await fetch("/api/settings/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, isActive: false })
    });
    onChanged?.();
  }
  const label =
    platform === "TWITTER" ? "X / Twitter" : platform[0] + platform.slice(1).toLowerCase();
  return (
    <article className="rounded-lg border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md",
              platformStyles[platform] ?? "bg-slate-100 text-slate-700"
            )}
          >
            <PlugZap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">{label}</h2>
            <p className="text-xs text-slate-500">Publishing, analytics, and inbox sync</p>
          </div>
        </div>
        <Badge tone={account?.isActive ? "PUBLISHED" : "DRAFT"}>
          {account?.isActive ? "Connected" : "Disconnected"}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-xs">
        <span className="flex items-center gap-2 text-slate-600">
          <Radio className="h-4 w-4" aria-hidden="true" />
          {account?.accountName ?? "No account"}
        </span>
        <span className="flex items-center gap-2 text-slate-600">
          <Users className="h-4 w-4" aria-hidden="true" />
          {account?.followerCount ?? 0} followers
        </span>
      </div>
      <Button
        className="mt-4 w-full"
        variant={account?.isActive ? "secondary" : "primary"}
        onClick={account?.isActive ? disconnect : connect}
      >
        {account?.isActive ? "Disconnect channel" : "Connect channel"}
      </Button>
    </article>
  );
}
