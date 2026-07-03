"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiJson } from "@/lib/client-api";

export type CompanyOption = { id: string; name: string };

type CompanySelectProps = {
  value: string;
  onChange: (companyId: string) => void;
  selectedCompany?: CompanyOption | null;
  disabled?: boolean;
};

const PAGE_SIZE = 20;

export function CompanySelect({
  value,
  onChange,
  selectedCompany = null,
  disabled = false
}: CompanySelectProps) {
  const searchId = useId();
  const selectId = useId();
  const statusId = useId();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState<CompanyOption | null>(selectedCompany);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!value) setSelectedLabel(null);
  }, [value]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort: "name",
      direction: "asc"
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [debouncedSearch, page]);

  const companiesQuery = useQuery({
    queryKey: ["companies", "picker", query],
    queryFn: () =>
      apiJson<{ items: CompanyOption[]; total: number; page: number; pageSize: number }>(
        `/api/companies?${query}`
      ),
    placeholderData: (previousData) => previousData
  });

  const items = companiesQuery.data?.items ?? [];
  const total = companiesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedIsVisible = items.some((company) => company.id === value);

  return (
    <div className="space-y-2">
      <label className="relative block text-xs font-medium text-slate-600" htmlFor={searchId}>
        Search company options
        <Search
          className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id={searchId}
          className="mt-1 pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, industry, or website"
          disabled={disabled}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor={selectId}>
        Company
        <Select
          id={selectId}
          className="mt-1"
          name="companyId"
          value={value}
          onChange={(event) => {
            const companyId = event.target.value;
            const option = items.find((company) => company.id === companyId) ?? null;
            setSelectedLabel(option);
            onChange(companyId);
          }}
          disabled={disabled}
          aria-describedby={statusId}
        >
          <option value="">Independent / not linked</option>
          {value && !selectedIsVisible ? (
            <option value={value}>
              {selectedLabel?.name ?? selectedCompany?.name ?? "Selected company"}
            </option>
          ) : null}
          {items.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>
      </label>
      <div id={statusId} className="flex min-h-8 items-center justify-between gap-3 text-xs">
        <span
          className={companiesQuery.isError ? "text-red-700" : "text-slate-500"}
          aria-live="polite"
        >
          {companiesQuery.isError
            ? "Company options could not be loaded."
            : companiesQuery.isFetching
              ? "Loading companies…"
              : total
                ? `${total} matching ${total === 1 ? "company" : "companies"}`
                : "No matching companies"}
        </span>
        {!companiesQuery.isError && totalPages > 1 ? (
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2"
              disabled={disabled || page <= 1 || companiesQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Previous company options page"
            >
              Previous
            </Button>
            <span className="whitespace-nowrap text-slate-500">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2"
              disabled={disabled || page >= totalPages || companiesQuery.isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              aria-label="Next company options page"
            >
              Next
            </Button>
          </span>
        ) : null}
        {companiesQuery.isError ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => companiesQuery.refetch()}
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
