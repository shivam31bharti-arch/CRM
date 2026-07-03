// Topbar notification bell with unread count.
"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  NotificationDropdown,
  type NotificationRow
} from "@/components/layout/NotificationDropdown";
import { apiJson } from "@/lib/client-api";
import { useState } from "react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiJson<{ items: NotificationRow[]; unreadCount: number }>("/api/notifications")
  });
  const unread = data?.unreadCount ?? 0;
  return (
    <div className="relative">
      <Button
        variant="ghost"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
        className="relative px-2"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread ? (
          <span className="absolute right-0 top-0 min-w-4 rounded-full bg-red-600 px-1 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </Button>
      <NotificationDropdown open={open} notifications={data?.items ?? []} />
    </div>
  );
}
