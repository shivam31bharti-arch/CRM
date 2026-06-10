// Generic responsive data table for CRM record lists.
import { ArrowUpDown } from "lucide-react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onSort
}: {
  rows: T[];
  columns: Array<Column<T>>;
  onSort?: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                <button
                  type="button"
                  className="focus-ring inline-flex items-center gap-1 rounded"
                  onClick={() => column.sortable && onSort?.(String(column.key))}
                  aria-label={column.sortable ? `Sort by ${column.header}` : undefined}
                >
                  {column.header}
                  {column.sortable ? <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
