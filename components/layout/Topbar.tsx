// Application topbar with mobile nav affordance and session actions.
"use client";

import { signOut, useSession } from "next-auth/react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/shared/Avatar";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Topbar() {
  const { data } = useSession();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur">
      <Button variant="ghost" className="px-2 md:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        <Input className="border-slate-200 bg-slate-50 pl-9" placeholder="Search contacts, deals, posts..." aria-label="Global search" />
      </div>
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
    </header>
  );
}
