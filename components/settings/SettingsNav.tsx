"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, PlugZap, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsLinks = [
  { href: "/settings", label: "Profile", icon: UserRound },
  { href: "/settings/integrations", label: "Integrations", icon: PlugZap },
  { href: "/settings/billing", label: "Billing", icon: CreditCard }
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings"
      className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {settingsLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "focus-ring flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition",
              active
                ? "border-primary text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
