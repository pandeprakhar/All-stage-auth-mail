import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import type { Category, Paginated, Subcategory } from "@/lib/admin-types";
import { PageHeader, Pill } from "@/components/admin/ui";
import { Button, Field, Input, Select } from "@/components/admin/Form";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";

export const Route = createFileRoute("/admin/subcategories")({
  component: SubcategoriesPage,
});

interface FormState {
  name: string;
  slug: string;
  category_id: string;
  status: "active" | "inactive";
}

const empty: FormState = { name: "", slug: "", category_id: "", status: "active" };
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

function SubcategoriesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugDirty, setSlugDirty] = useState(false);

  const list = useQuery({
    queryKey: ["admin", "subcategories", { page, perPage, search, categoryFilter, statusFilter }],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) p.set("search", search);
      if (categoryFilter) p.set("category_id", categoryFilter);
      if (statusFilter) p.set("status", statusFilter);
      return adminApi.get<Paginated<Subcategory>>(`/subcategories?${p.toString()}`);
    },
    retry: false,
  });

  const categories = useQuery({
    queryKey: ["admin", "categories", "all"],
    queryFn: () => adminApi.get<Category[]>("/categories?per_page=200"),
    retry: false,
  });

  const openCreate = () => {
    setForm({ ...empty, category_id: categoryFilter });
    setSlugDirty(false);
    setErrors({});
    setCreating(true);
  };

  const openEdit = (s: Subcategory) => {
    setForm({
      name: s.name,
      slug: s.slug,
      category_id: String(s.category_id),
      status: s.status,
    });
    setSlugDirty(true);
    setErrors({});
    setEditing(s);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.put(`/subcategories/${editing.id}`, form)
        : adminApi.post("/subcategories", form),
    onSuccess: () => {
      toast.success(editing ? "Subcategory updated" : "Subcategory created");
      qc.invalidateQueries({ queryKey: ["admin", "subcategories"] });
      close();
    },
    onError: (err) => {
      if (err instanceof AdminApiError && err.data && typeof err.data === "object") {
        const d = err.data as { errors?: Record<string, string[]>; message?: string };
        if (d.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(d.errors)) mapped[k] = v[0];
          setErrors(mapped);
        }
        toast.error(d.message || err.message);
      } else toast.error("Save failed");
    },
  });

  const del = useMutation({
    mutationFn: (id: string | number) => adminApi.delete(`/subcategories/${id}`),
    onSuccess: () => {
      toast.success("Subcategory deleted");
      qc.invalidateQueries({ queryKey: ["admin", "subcategories"] });
      setConfirmId(null);
    },
    onError: (e) => toast.error(e instanceof AdminApiError ? e.message : "Delete failed"),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.slug.trim()) e.slug = "Required";
    if (!form.category_id) e.category_id = "Pick a parent category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const columns: Column<Subcategory>[] = [
    { key: "name", header: "Subcategory", render: (r) => (
      <div>
        <div className="font-medium">{r.name}</div>
        <div className="text-xs text-muted-foreground">/{r.slug}</div>
      </div>
    ) },
    { key: "category_name", header: "Parent category", render: (r) =>
      <span className="text-sm">{r.category_name ?? "—"}</span>
    },
    { key: "products_count", header: "Products", render: (r) =>
      <span className="text-sm">{r.products_count ?? 0}</span>
    },
    { key: "status", header: "Status", render: (r) =>
      <Pill tone={r.status === "active" ? "success" : "default"}>{r.status}</Pill>
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(r)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmId(r.id)} className="grid h-8 w-8 place-items-center rounded-md text-red-600 hover:bg-red-500/10" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Subcategories"
        description="Second-level categories nested under a parent."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add subcategory</Button>}
      />

      {list.isError && (
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          {list.error instanceof AdminApiError ? list.error.message : "Could not load subcategories."}
        </div>
      )}

      <DataTable<Subcategory>
        columns={columns}
        rows={list.data?.data ?? []}
        total={list.data?.total ?? 0}
        page={page}
        perPage={perPage}
        loading={list.isLoading}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        rowKey={(r) => r.id}
        emptyText="No subcategories yet."
        filters={
          <>
            <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="h-9 w-48">
              <option value="">All parents</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-9 w-36">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </>
        }
      />

      <Modal
        open={creating || !!editing}
        onClose={close}
        title={editing ? "Edit subcategory" : "Add subcategory"}
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => validate() && save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Parent category" required error={errors.category_id}>
            <Select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">— Select —</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Name" required error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugDirty ? f.slug : slugify(name) }));
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" required error={errors.slug}>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugDirty(true);
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                }}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmId != null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId != null && del.mutate(confirmId)}
        title="Delete subcategory?"
        message="This will permanently delete the subcategory. Products assigned to it will keep their parent category."
        destructive
        confirmLabel="Delete"
        loading={del.isPending}
      />
    </div>
  );
}
