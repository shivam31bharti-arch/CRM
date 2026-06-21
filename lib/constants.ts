// Shared product constants for navigation and social platforms.
import {
  BarChart3,
  CalendarDays,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Settings,
  UserRoundCog,
  Users
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Command Center", href: "/command-center", icon: Sparkles },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Deals", href: "/deals", icon: KanbanSquare },
  { label: "Scheduler", href: "/scheduler", icon: CalendarDays },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Team", href: "/team", icon: UserRoundCog },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const dealStages = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST"
] as const;

export const platforms = ["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"] as const;

export const platformLimits: Record<(typeof platforms)[number], number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  INSTAGRAM: 2200,
  FACEBOOK: 63206
};

export const statusColors: Record<string, string> = {
  LEAD: "bg-sky-50 text-sky-700 border-sky-200",
  PROSPECT: "bg-violet-50 text-violet-700 border-violet-200",
  CUSTOMER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CHURNED: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-slate-100 text-slate-700 border-slate-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-700 border-zinc-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200"
};
