import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import type { Category, Paginated } from "@/lib/admin-types";
import { PageHeader, Pill } from "@/components/admin/ui";
import { Button, Field, Input, Select, Textarea } from "@/components/admin/Form";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

interface FormState {
  name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
}

const empty: FormState = { name: "", slug: "", description: "", status: "active" };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function CategoriesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<File[]>([]);
  const [existingImage, setExistingImage] = useState<{ id?: string | number; url: string }[]>([]);
  const [removeImage, setRemoveImage] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);

  const list = useQuery({
    queryKey: ["admin", "categories", { page, perPage, search, status }],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) p.set("search", search);
      if (status) p.set("status", status);
      return adminApi.get<Paginated<Category>>(`/categories?${p.toString()}`);
    },
    retry: false,
  });

  const openCreate = () => {
    setForm(empty);
    setImage([]);
    setExistingImage([]);
    setRemoveImage(false);
    setErrors({});
    setSlugDirty(false);
    setCreating(true);
  };

  const openEdit = (c: Category) => {
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      status: c.status,
    });
    setImage([]);
    setExistingImage(c.image_url ? [{ url: c.image_url }] : []);
    setRemoveImage(false);
    setErrors({});
    setSlugDirty(true);
    setEditing(c);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (image[0]) fd.append("image", image[0]);
      if (removeImage) fd.append("remove_image", "1");
      if (editing) {
        fd.append("_method", "PUT");
        return adminApi.post<Category>(`/categories/${editing.id}`, fd);
      }
      return adminApi.post<Category>("/categories", fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
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
    mutationFn: (id: string | number) => adminApi.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      setConfirmId(null);
    },
    onError: (e) => toast.error(e instanceof AdminApiError ? e.message : "Delete failed"),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.slug.trim()) e.slug = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Category",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {r.image_url ? (
              <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <FolderTree className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">/{r.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "subcategories_count",
      header: "Subcategories",
      render: (r) => <span className="text-sm">{r.subcategories_count ?? 0}</span>,
    },
    {
      key: "products_count",
      header: "Products",
      render: (r) => <span className="text-sm">{r.products_count ?? 0}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Pill tone={r.status === "active" ? "success" : "default"}>{r.status}</Pill>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(r)}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmId(r.id)}
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
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Categories"
        description="Top-level product categories."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add category
          </Button>
        }
      />

      {list.isError && (
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          {list.error instanceof AdminApiError ? list.error.message : "Could not load categories."}
        </div>
      )}

      <DataTable<Category>
        columns={columns}
        rows={list.data?.data ?? []}
        total={list.data?.total ?? 0}
        page={page}
        perPage={perPage}
        loading={list.isLoading}
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
        emptyText="No categories yet."
        filters={
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 w-36"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        }
      />

      <Modal
        open={creating || !!editing}
        onClose={close}
        title={editing ? "Edit category" : "Add category"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              onClick={() => validate() && save.mutate()}
              disabled={save.isPending}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
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
          <Field label="Description" error={errors.description}>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <ImageUploader
            label="Image"
            value={image}
            onChange={setImage}
            existing={existingImage}
            onRemoveExisting={() => {
              setExistingImage([]);
              setRemoveImage(true);
            }}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmId != null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId != null && del.mutate(confirmId)}
        title="Delete category?"
        message="This will permanently delete the category. Products assigned to it will be uncategorized."
        destructive
        confirmLabel="Delete"
        loading={del.isPending}
      />
    </div>
  );
}
