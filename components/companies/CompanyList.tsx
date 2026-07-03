"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, UserMinus, Users } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { WorkspaceMetrics } from "@/components/shared/WorkspaceMetrics";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiJson } from "@/lib/client-api";

type CompanyRow = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  updatedAt: string;
  owner?: { name?: string | null } | null;
  _count: { contacts: number };
};

const EMPTY_COMPANIES: CompanyRow[] = [];

export function CompanyList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "25",
      sort: "updatedAt"
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [debouncedSearch, page]);
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["companies", query],
    queryFn: () =>
      apiJson<{ items: CompanyRow[]; total: number; page: number; pageSize: number }>(
        `/api/companies?${query}`
      ),
    placeholderData: (previousData) => previousData
  });
  const items = data?.items ?? EMPTY_COMPANIES;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const visibleContacts = items.reduce((sum, company) => sum + company._count.contacts, 0);
  const unowned = items.filter((company) => !company.owner).length;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <WorkspaceMetrics
        items={[
          {
            label: "Companies",
            value: data?.total ?? 0,
            helper: "Active accounts",
            icon: Building2,
            tone: "blue"
          },
          {
            label: "Relationships",
            value: visibleContacts,
            helper: "Contacts on this page",
            icon: Users,
            tone: "green"
          },
          {
            label: "Unowned",
            value: unowned,
            helper: unowned ? "Needs accountability" : "Ownership is clear",
            icon: UserMinus,
            tone: "amber"
          }
        ]}
      />
      <label className="relative block max-w-md">
        <span className="sr-only">Search companies</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, industry, or website"
        />
      </label>
      {isLoading ? <LoadingState /> : null}
      {isError ? (
        <ErrorState message="Companies could not be loaded." onRetry={() => refetch()} />
      ) : null}
      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          body="Create the first company or adjust the search."
        />
      ) : null}
      {items.length ? (
        <>
          <DataTable<CompanyRow>
            rows={items}
            columns={[
              {
                key: "name",
                header: "Company",
                render: (row) => (
                  <Link
                    href={`/companies/${row.id}`}
                    className="font-semibold text-slate-950 hover:text-primary"
                  >
                    {row.name}
                  </Link>
                )
              },
              { key: "industry", header: "Industry", render: (row) => row.industry || "—" },
              {
                key: "contacts",
                header: "Contacts",
                render: (row) => row._count.contacts
              },
              { key: "owner", header: "Owner", render: (row) => row.owner?.name || "Unassigned" },
              {
                key: "updatedAt",
                header: "Updated",
                render: (row) => new Date(row.updatedAt).toLocaleDateString()
              }
            ]}
          />
          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total} companies
            </span>
            <span className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-8"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="whitespace-nowrap">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="h-8"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
