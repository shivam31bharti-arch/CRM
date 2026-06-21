"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Target, UserCheck, UserMinus, Users } from "lucide-react";
import { ContactFilters } from "@/components/contacts/ContactFilters";
import { Avatar } from "@/components/shared/Avatar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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

const EMPTY_CONTACTS: ContactRow[] = [];

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
  const items: ContactRow[] = data?.items ?? EMPTY_CONTACTS;
  const customers = items.filter((item) => item.status === "CUSTOMER").length;
  const prospects = items.filter((item) => item.status === "PROSPECT").length;
  const unassigned = items.filter((item) => !item.assignedTo).length;

  return (
    <div className="space-y-4">
      <WorkspaceMetrics
        items={[
          {
            label: "Relationship base",
            value: data?.total ?? 0,
            helper: "Total contacts",
            icon: Users,
            tone: "slate"
          },
          {
            label: "Customers",
            value: customers,
            helper: "Active on this page",
            icon: UserCheck,
            tone: "green"
          },
          {
            label: "Prospects",
            value: prospects,
            helper: "Ready to nurture",
            icon: Target,
            tone: "blue"
          },
          {
            label: "Unassigned",
            value: unassigned,
            helper: unassigned ? "Needs an owner" : "Ownership is clear",
            icon: UserMinus,
            tone: "amber"
          }
        ]}
      />
      <div className="flex flex-col gap-3 border-y border-slate-200 bg-white/60 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <ContactFilters
            search={search}
            status={status}
            onSearch={setSearch}
            onStatus={setStatus}
          />
        </div>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => window.open("/api/contacts/export", "_blank")}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export
        </Button>
      </div>
      {isLoading ? <LoadingState /> : null}
      {isError ? (
        <ErrorState message="Contacts could not be loaded." onRetry={() => refetch()} />
      ) : null}
      {!isLoading && items.length === 0 ? (
        <EmptyState
          title="No contacts found"
          body="Adjust the filters or use Quick add to create the first relationship in this workspace."
        />
      ) : null}
      {items.length ? (
        <>
          <DataTable<ContactRow>
            rows={items}
            onSort={setSort}
            columns={[
              {
                key: "firstName",
                header: "Name",
                sortable: true,
                render: (row) => (
                  <Link
                    href={`/contacts/${row.id}`}
                    className="flex items-center gap-2 font-semibold text-slate-900 hover:text-primary"
                  >
                    <Avatar
                      name={`${row.firstName} ${row.lastName}`}
                      src={row.avatarUrl}
                      className="h-8 w-8"
                    />
                    {row.firstName} {row.lastName}
                  </Link>
                )
              },
              { key: "company", header: "Company", sortable: true },
              { key: "email", header: "Email", sortable: true },
              {
                key: "status",
                header: "Status",
                sortable: true,
                render: (row) => <Badge tone={row.status}>{row.status}</Badge>
              },
              {
                key: "assignedTo",
                header: "Assigned",
                render: (row) => row.assignedTo?.name ?? "Unassigned"
              },
              {
                key: "activities",
                header: "Last activity",
                render: (row) => row.activities?.[0]?.createdAt?.slice(0, 10) ?? "None"
              }
            ]}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {items.length} of {data.total} contacts
            </span>
            <span>Sorted by {sort.replaceAll("At", " date").toLowerCase()}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
