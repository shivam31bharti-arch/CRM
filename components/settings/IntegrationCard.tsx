// Social integration card with connect/disconnect actions.
"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function IntegrationCard({ platform, account, onChanged }: { platform: string; account?: { accountName: string; followerCount?: number | null; isActive: boolean } | null; onChanged?: () => void }) {
  function connect() {
    window.location.href = `/api/social-accounts/connect?platform=${encodeURIComponent(platform)}`;
  }
  async function disconnect() {
    await fetch("/api/settings/integrations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, isActive: false }) });
    onChanged?.();
  }
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{platform}</h2>
        <Badge tone={account?.isActive ? "PUBLISHED" : "DRAFT"}>{account?.isActive ? "Connected" : "Disconnected"}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-500">{account ? `${account.accountName} · ${account.followerCount ?? 0} followers` : "No account connected."}</p>
      <Button className="mt-4" variant={account?.isActive ? "secondary" : "primary"} onClick={account?.isActive ? disconnect : connect}>
        {account?.isActive ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
