/**
 * Reusable admin data-table with search, filters slot, pagination,
 * row selection, and bulk-action bar. Server-driven (page/perPage/search/sort).
 */
import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  loading?: boolean;
  search: string;
  onSearch: (v: string) => void;
  sort?: { key: string; dir: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
  onPageChange: (p: number) => void;
  onPerPageChange?: (n: number) => void;
  rowKey: (row: T) => string | number;
  selectable?: boolean;
  selected?: (string | number)[];
  onSelectedChange?: (ids: (string | number)[]) => void;
  bulkActions?: ReactNode;
  filters?: ReactNode;
  emptyText?: string;
}

export function DataTable<T>({
  columns,
  rows,
  total,
  page,
  perPage,
  loading,
  search,
  onSearch,
  sort,
  onSort,
  onPageChange,
  onPerPageChange,
  rowKey,
  selectable,
  selected = [],
  onSelectedChange,
  bulkActions,
  filters,
  emptyText = "No records found.",
}: DataTableProps<T>) {
  const [searchLocal, setSearchLocal] = useState(search);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));

  const toggleAll = () => {
    if (!onSelectedChange) return;
    if (allChecked) onSelectedChange(selected.filter((id) => !rows.some((r) => rowKey(r) === id)));
    else onSelectedChange([...new Set([...selected, ...rows.map((r) => rowKey(r))])]);
  };

  const toggleRow = (id: string | number) => {
    if (!onSelectedChange) return;
    onSelectedChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(searchLocal);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            onBlur={() => searchLocal !== search && onSearch(searchLocal)}
            placeholder="Search…"
            className="h-9 w-64 rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      </div>

      {selectable && selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span>
            <strong>{selected.length}</strong> selected
          </span>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
                {selectable && (
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      aria-label="Select all"
                      className="h-4 w-4"
                    />
                  </th>
                )}
                {columns.map((c) => {
                  const isSorted = sort?.key === c.key;
                  const Icon = !isSorted
                    ? ArrowUpDown
                    : sort?.dir === "asc"
                      ? ArrowUp
                      : ArrowDown;
                  return (
                    <th
                      key={c.key}
                      className={cn("px-3 py-2.5 font-medium", c.headerClassName)}
                    >
                      {c.sortable && onSort ? (
                        <button
                          type="button"
                          onClick={() => onSort(c.key)}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {c.header}
                          <Icon className="h-3 w-3" />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-16 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-16 text-center text-sm text-muted-foreground"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = rowKey(r);
                  const checked = selected.includes(id);
                  return (
                    <tr key={id} className={cn("hover:bg-muted/40", checked && "bg-muted/30")}>
                      {selectable && (
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(id)}
                            aria-label="Select row"
                            className="h-4 w-4"
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td key={c.key} className={cn("px-3 py-2.5", c.className)}>
                          {c.render(r)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="ml-3">
            {total === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of{" "}
            {total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
