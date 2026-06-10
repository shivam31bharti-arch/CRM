// Notification dropdown for recent unread and read events.
"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationDropdown({ open, notifications }: { open: boolean; notifications: NotificationRow[] }) {
  if (!open) return null;
  return (
    <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border bg-white p-2 shadow-panel">
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-sm font-semibold">Notifications</p>
        <Button
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => fetch("/api/notifications/read-all", { method: "PATCH" })}
        >
          Mark all
        </Button>
      </div>
      <div className="max-h-96 overflow-auto">
        {notifications.length === 0 ? (
          <p className="p-3 text-sm text-slate-500">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.link ?? "#"}
              className="block rounded-md p-2 text-sm hover:bg-slate-50"
              onClick={() => fetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" })}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-medium">{notification.title}</span>
                {!notification.isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" /> : null}
              </span>
              <span className="mt-1 block text-slate-500">{notification.body}</span>
              <span className="mt-1 block text-xs text-slate-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
