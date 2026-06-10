// Responsive application sidebar navigation.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
      <div className="flex h-16 items-center border-b px-5">
        <div>
          <p className="text-lg font-bold text-slate-950">Social CRM</p>
          <p className="text-xs text-slate-500">Manager console</p>
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
                active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
