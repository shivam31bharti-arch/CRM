// Compact contact card for detail sidebars and mobile layouts.
import Link from "next/link";
import { Avatar } from "@/components/shared/Avatar";
import { Badge } from "@/components/ui/Badge";

type Contact = { id: string; firstName: string; lastName: string; company?: string | null; status: string; avatarUrl?: string | null };

export function ContactCard({ contact }: { contact: Contact }) {
  const name = `${contact.firstName} ${contact.lastName}`;
  return (
    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-slate-50">
      <Avatar name={name} src={contact.avatarUrl} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-xs text-slate-500">{contact.company ?? "No company"}</span>
      </span>
      <Badge tone={contact.status}>{contact.status}</Badge>
    </Link>
  );
}
