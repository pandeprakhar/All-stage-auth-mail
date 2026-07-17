import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  orders_count: number;
  total_spent: number;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

function CustomersPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "customers", { page, perPage, search }],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) p.set("search", search);
      return adminApi.get<Paginated<Customer>>(`/customers?${p.toString()}`);
    },
    retry: false,
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (r) => <span className="text-muted-foreground">{r.phone || "—"}</span>,
    },
    {
      key: "orders_count",
      header: "Orders",
      render: (r) => <span className="font-semibold">{r.orders_count}</span>,
    },
    {
      key: "total_spent",
      header: "Total Spent",
      render: (r) => <span className="font-semibold">₹{r.total_spent.toLocaleString()}</span>,
    },
    {
      key: "created_at",
      header: "Registration Date",
      render: (r) => (
        <span className="text-muted-foreground">
          {new Date(r.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage and view customer order metrics." />

      {error instanceof AdminApiError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        perPage={perPage}
        loading={isLoading}
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        rowKey={(r) => r.id}
        emptyText="No customers found."
      />
    </div>
  );
}
