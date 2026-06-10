// Responsive application sidebar navigation.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-slate-950 text-white md:block">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div>
          <p className="text-lg font-bold">Social CRM</p>
          <p className="text-xs text-slate-400">Manager console</p>
        </div>
      </div>
      <nav className="space-y-1 p-3" aria-label="Primary">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
