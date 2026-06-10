// Contact table with avatar, status, assignment, search, sorting, and pagination.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/shared/Avatar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContactFilters } from "@/components/contacts/ContactFilters";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  company?: string | null;
  status: string;
  avatarUrl?: string | null;
  assignedTo?: { name?: string | null } | null;
  activities?: Array<{ createdAt: string }>;
};

export function ContactTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("createdAt");
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "25", sort });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return params.toString();
  }, [search, status, sort]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["contacts", query],
    queryFn: async () => (await fetch(`/api/contacts?${query}`)).json()
  });

  return (
    <div>
      <ContactFilters search={search} status={status} onSearch={setSearch} onStatus={setStatus} />
      {isLoading ? <LoadingState /> : null}
      {isError ? <ErrorState message="Contacts could not be loaded." onRetry={() => refetch()} /> : null}
      {!isLoading && data?.items?.length === 0 ? <EmptyState title="No contacts found" body="Create or import contacts to start building your CRM." /> : null}
      {data?.items?.length ? (
        <>
          <DataTable<ContactRow>
            rows={data.items}
            onSort={setSort}
            columns={[
              {
                key: "firstName",
                header: "Name",
                sortable: true,
                render: (row) => (
                  <Link href={`/contacts/${row.id}`} className="flex items-center gap-2 font-medium text-blue-700">
                    <Avatar name={`${row.firstName} ${row.lastName}`} src={row.avatarUrl} className="h-8 w-8" />
                    {row.firstName} {row.lastName}
                  </Link>
                )
              },
              { key: "company", header: "Company", sortable: true },
              { key: "email", header: "Email", sortable: true },
              { key: "status", header: "Status", sortable: true, render: (row) => <Badge tone={row.status}>{row.status}</Badge> },
              { key: "assignedTo", header: "Assigned", render: (row) => row.assignedTo?.name ?? "Unassigned" },
              { key: "activities", header: "Last activity", render: (row) => row.activities?.[0]?.createdAt?.slice(0, 10) ?? "None" }
            ]}
          />
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>{data.total} total contacts</span>
            <Button variant="secondary" onClick={() => window.open("/api/contacts/export", "_blank")}>
              Export CSV
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
