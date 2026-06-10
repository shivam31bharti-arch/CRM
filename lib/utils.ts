// Shared utility helpers for class names, API responses, and formatting.
import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number, code = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0
  }).format(value);
}

export function shortDate(value: string | Date | null | undefined) {
  if (!value) return "No date";
  return format(new Date(value), "MMM d, yyyy");
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join(
    "\n"
  );
}
