// Application topbar with mobile nav affordance and session actions.
"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/shared/Avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Sidebar } from "@/components/layout/Sidebar";

export function Topbar() {
  const { data } = useSession();
  const [navigationOpen, setNavigationOpen] = useState(false);
  useEffect(() => {
    if (!navigationOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNavigationOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navigationOpen]);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur">
      <Button
        variant="ghost"
        className="px-2 md:hidden"
        aria-label="Open navigation"
        onClick={() => setNavigationOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <div className="flex-1" />
      <NotificationBell />
      <div className="hidden items-center gap-2 sm:flex">
        <Avatar name={data?.user?.name} src={data?.user?.image} />
        <div className="text-sm">
          <p className="font-medium leading-none">{data?.user?.name ?? "User"}</p>
          <p className="mt-1 text-xs text-slate-500">{data?.user?.role ?? "MEMBER"}</p>
        </div>
      </div>
      <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
        Logout
      </Button>
      {navigationOpen ? (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          />
          <div className="relative h-full shadow-2xl">
            <Sidebar mobile onNavigate={() => setNavigationOpen(false)} />
            <Button
              variant="ghost"
              className="absolute right-2 top-2 text-white hover:bg-white/10"
              aria-label="Close navigation"
              onClick={() => setNavigationOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
