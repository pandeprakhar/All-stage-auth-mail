import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  Pencil,
  Trash2,
  Star,
  StarOff,
  MoreHorizontal,
  Package,
} from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import type { Brand, Category, Paginated, Product } from "@/lib/admin-types";
import { PageHeader, Pill } from "@/components/admin/ui";
import { Button, Select } from "@/components/admin/Form";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/Modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  component: ProductsListPage,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

function ProductsListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>({
    key: "created_at",
    dir: "desc",
  });
  const [status, setStatus] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [confirm, setConfirm] = useState<
    | { kind: "delete-one"; id: string | number }
    | { kind: "bulk-delete" }
    | null
  >(null);

  const listQuery = useQuery({
    queryKey: ["admin", "products", { page, perPage, search, sort, status, categoryId, brandId }],
    queryFn: () => {
      const p = new URLSearchParams();
      p.set("page", String(page));
      p.set("per_page", String(perPage));
      if (search) p.set("search", search);
      if (status) p.set("status", status);
      if (categoryId) p.set("category_id", categoryId);
      if (brandId) p.set("brand_id", brandId);
      if (sort) p.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.key}`);
      return adminApi.get<Paginated<Product>>(`/products?${p.toString()}`);
    },
    retry: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories", "all"],
    queryFn: () => adminApi.get<Category[]>("/categories?per_page=200&status=active"),
    retry: false,
  });
  const brandsQuery = useQuery({
    queryKey: ["admin", "brands", "all"],
    queryFn: () => adminApi.get<Brand[]>("/brands?per_page=200&status=active"),
    retry: false,
  });

  const deleteOne = useMutation({
    mutationFn: (id: string | number) => adminApi.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e) => toast.error(e instanceof AdminApiError ? e.message : "Delete failed"),
  });

  const bulkAction = useMutation({
    mutationFn: (action: "delete" | "activate" | "deactivate") =>
      adminApi.post("/products/bulk-action", { action, ids: selected }),
    onSuccess: (_r, action) => {
      toast.success(`${selected.length} product(s) ${action}d`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e) => toast.error(e instanceof AdminApiError ? e.message : "Bulk action failed"),
  });

  const toggleFeatured = useMutation({
    mutationFn: (row: Product) =>
      adminApi.patch(`/products/${row.id}`, { featured: !row.featured }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e) => toast.error(e instanceof AdminApiError ? e.message : "Update failed"),
  });

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {r.primary_image_url ? (
              <img src={r.primary_image_url} alt={r.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <Package className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{r.name}</div>
            {r.sku && <div className="text-xs text-muted-foreground">SKU: {r.sku}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "category_name",
      header: "Category",
      render: (r) => <span className="text-sm">{r.category_name ?? "—"}</span>,
    },
    {
      key: "brand_name",
      header: "Brand",
      render: (r) => <span className="text-sm">{r.brand_name ?? "—"}</span>,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => (
        <div className="text-right">
          <div className="font-medium">{inr(r.discount_price ?? r.price)}</div>
          {r.discount_price != null && r.discount_price !== r.price && (
            <div className="text-xs text-muted-foreground line-through">{inr(r.price)}</div>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => (
        <div
          className={cn(
            "text-right text-sm font-medium",
            r.stock <= 0 ? "text-red-600" : r.stock < 5 ? "text-amber-600" : "",
          )}
        >
          {r.stock}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Pill tone={r.status === "active" ? "success" : "default"}>{r.status}</Pill>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => toggleFeatured.mutate(r)}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
            aria-label="Toggle featured"
            title={r.featured ? "Unfeature" : "Feature"}
          >
            {r.featured ? (
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <Link
            to="/admin/products/$id/edit"
            params={{ id: String(r.id) }}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setConfirm({ kind: "delete-one", id: r.id })}
            className="grid h-8 w-8 place-items-center rounded-md text-red-600 hover:bg-red-500/10"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Products"
        description="Manage catalog, pricing, stock and media."
        actions={
          <>
            <Link
              to="/admin/products/bulk-import"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
            >
              <Upload className="h-4 w-4" /> Bulk import
            </Link>
            <Link
              to="/admin/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </>
        }
      />

      {listQuery.isError && (
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          {listQuery.error instanceof AdminApiError ? listQuery.error.message : "Could not load products."}
        </div>
      )}

      <DataTable<Product>
        columns={columns}
        rows={rows}
        total={total}
        page={page}
        perPage={perPage}
        loading={listQuery.isLoading}
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        sort={sort}
        onSort={(k) =>
          setSort((prev) => (prev?.key === k ? { key: k, dir: prev.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }))
        }
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        rowKey={(r) => r.id}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        emptyText="No products yet — add your first one."
        filters={
          <>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 w-36">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="h-9 w-44">
              <option value="">All categories</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select value={brandId} onChange={(e) => { setBrandId(e.target.value); setPage(1); }} className="h-9 w-40">
              <option value="">All brands</option>
              {(brandsQuery.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </>
        }
        bulkActions={
          <>
            <Button size="sm" variant="outline" onClick={() => bulkAction.mutate("activate")}>
              Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction.mutate("deactivate")}>
              Deactivate
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm({ kind: "bulk-delete" })}>
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </>
        }
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "bulk-delete" ? "Delete selected products?" : "Delete product?"}
        message={
          confirm?.kind === "bulk-delete"
            ? `This will permanently remove ${selected.length} product(s). This action cannot be undone.`
            : "This will permanently remove this product. This action cannot be undone."
        }
        destructive
        confirmLabel="Delete"
        loading={deleteOne.isPending || bulkAction.isPending}
        onConfirm={() => {
          if (confirm?.kind === "delete-one") deleteOne.mutate(confirm.id, { onSuccess: () => setConfirm(null) });
          else if (confirm?.kind === "bulk-delete")
            bulkAction.mutate("delete", { onSuccess: () => setConfirm(null) });
        }}
      />

      {/* Suppress unused-var warning for navigate reserved for future row-click */}
      {false && navigate({ to: "/admin/products" })}
    </div>
  );
}
