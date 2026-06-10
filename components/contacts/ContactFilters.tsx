// Search and status filters for the contact list.
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function ContactFilters({
  search,
  status,
  onSearch,
  onStatus
}: {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
}) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
      <label className="relative block">
        <span className="sr-only">Search contacts</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        <Input value={search} onChange={(event) => onSearch(event.target.value)} className="pl-9" placeholder="Search name, email, company" />
      </label>
      <label>
        <span className="sr-only">Status</span>
        <Select value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospect</option>
          <option value="CUSTOMER">Customer</option>
          <option value="CHURNED">Churned</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </label>
    </div>
  );
}
