"use client";

import { useState } from "react";
import { CalendarDays, Mail, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiJson } from "@/lib/client-api";

type GoogleStatus = {
  configured: boolean;
  connection: {
    email: string;
    status: "CONNECTED" | "REAUTH_REQUIRED";
    lastSyncedAt: string | null;
    lastError: string | null;
    _count: { emailRecords: number; calendarEvents: number };
  } | null;
};

export function GoogleWorkspaceCard() {
  const [action, setAction] = useState<"sync" | "disconnect" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { data, error, refetch } = useQuery({
    queryKey: ["google-workspace-status"],
    queryFn: () => apiJson<GoogleStatus>("/api/integrations/google/status")
  });
  const connection = data?.connection;

  async function postAction(kind: "sync" | "disconnect") {
    if (
      kind === "disconnect" &&
      !window.confirm("Disconnect Google Workspace and remove its imported provider records?")
    ) {
      return;
    }
    setAction(kind);
    setMessage(null);
    try {
      await apiJson(`/api/integrations/google/${kind}`, { method: "POST" });
      setMessage(kind === "sync" ? "Google Workspace sync completed." : "Google disconnected.");
      await refetch();
    } catch (actionError) {
      setMessage(actionError instanceof Error ? actionError.message : "The action failed.");
    } finally {
      setAction(null);
    }
  }

  return (
    <article className="rounded-lg border bg-white p-4 shadow-card md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">Google Workspace</h2>
          <p className="mt-1 text-xs text-slate-500">
            Metadata-only Gmail activity and your primary owned calendar. Email bodies and
            attachments are never imported.
          </p>
        </div>
        <Badge tone={connection?.status === "CONNECTED" ? "PUBLISHED" : "DRAFT"}>
          {connection?.status === "CONNECTED"
            ? "Connected"
            : connection?.status === "REAUTH_REQUIRED"
              ? "Reconnect required"
              : "Disconnected"}
        </Badge>
      </div>

      {connection ? (
        <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3 text-xs sm:grid-cols-3">
          <span className="flex items-center gap-2 text-slate-600">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {connection._count.emailRecords.toLocaleString()} email records
          </span>
          <span className="flex items-center gap-2 text-slate-600">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {connection._count.calendarEvents.toLocaleString()} calendar events
          </span>
          <span className="flex items-center gap-2 text-slate-600">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {connection.lastSyncedAt
              ? `Synced ${new Date(connection.lastSyncedAt).toLocaleString()}`
              : "Not synced yet"}
          </span>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-slate-700">
        {connection?.email ??
          (data?.configured
            ? "Connect one Google account to this CRM user."
            : "Add the Google OAuth environment variables to enable this integration.")}
      </p>
      {connection?.lastError ? (
        <p className="mt-2 text-sm text-red-700">Last sync error: {connection.lastError}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error.message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {!connection || connection.status === "REAUTH_REQUIRED" ? (
          <Button
            onClick={() => {
              window.location.href = "/api/integrations/google/connect";
            }}
            disabled={data ? !data.configured : true}
          >
            {connection ? "Reconnect Google" : "Connect Google"}
          </Button>
        ) : (
          <Button onClick={() => postAction("sync")} disabled={action !== null}>
            {action === "sync" ? "Syncing…" : "Sync now"}
          </Button>
        )}
        {connection ? (
          <Button
            variant="secondary"
            onClick={() => postAction("disconnect")}
            disabled={action !== null}
          >
            {action === "disconnect" ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : null}
      </div>
      <p className="mt-3 min-h-5 text-xs text-slate-600" aria-live="polite">
        {message}
      </p>
    </article>
  );
}
