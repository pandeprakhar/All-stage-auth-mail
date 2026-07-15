import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import type { Brand, Paginated } from "@/lib/admin-types";
import { PageHeader, Pill } from "@/components/admin/ui";
import { Button, Field, Input, Select } from "@/components/admin/Form";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/admin/brands")({
  component: BrandsPage,
});

interface FormState {
  name: string;
  slug: string;
  status: "active" | "inactive";
}

const empty: FormState = { name: "", slug: "", status: "active" };
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

function BrandsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File[]>([]);
  const [existingLogo, setExistingLogo] = useState<{ id?: string | number; url: string }[]>([]);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);

  const list = useQuery({
    queryKey: ["admin", "brands", { page, perPage, search, status }],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) p.set("search", search);
      if (status) p.set("status", status);
      return adminApi.get<Paginated<Brand>>(`/brands?${p.toString()}`);
    },
    retry: false,
  });

  const openCreate = () => {
    setForm(empty);
    setLogo([]);
    setExistingLogo([]);
    setRemoveLogo(false);
    setErrors({});
    setSlugDirty(false);
    setCreating(true);
  };

  const openEdit = (b: Brand) => {
    setForm({ name: b.name, slug: b.slug, status: b.status });
    setLogo([]);
    setExistingLogo(b.logo_url ? [{ url: b.logo_url }] : []);
    setRemoveLogo(false);
    setErrors({});
    setSlugDirty(true);
    setEditing(b);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (logo[0]) fd.append("logo", logo[0]);
      if (removeLogo) fd.append("remove_logo", "1");
      if (editing) {
        fd.append("_method", "PUT");
        return adminApi.post<Brand>(`/brands/${editing.id}`, fd);
      }
      return adminApi.post<Brand>("/brands", fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Brand updated" : "Brand created");
      qc.invalidateQueries({ queryKey: ["admin", "brands"] });
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
    mutationFn: (id: string | number) => adminApi.delete(`/brands/${id}`),
    onSuccess: () => {
      toast.success("Brand deleted");
      qc.invalidateQueries({ queryKey: ["admin", "brands"] });
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

  const columns: Column<Brand>[] = [
    {
      key: "name",
      header: "Brand",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white p-1">
            {r.logo_url ? (
              <img src={r.logo_url} alt={r.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <Tag className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">/{r.slug}</div>
          </div>
        </div>
      ),
    },
    { key: "products_count", header: "Products", render: (r) => <span className="text-sm">{r.products_count ?? 0}</span> },
    { key: "status", header: "Status", render: (r) => <Pill tone={r.status === "active" ? "success" : "default"}>{r.status}</Pill> },
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
        title="Brands"
        description="Manage brand names and logos."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add brand</Button>}
      />

      {list.isError && (
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          {list.error instanceof AdminApiError ? list.error.message : "Could not load brands."}
        </div>
      )}

      <DataTable<Brand>
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
        emptyText="No brands yet."
        filters={
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 w-36">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        }
      />

      <Modal
        open={creating || !!editing}
        onClose={close}
        title={editing ? "Edit brand" : "Add brand"}
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
          <ImageUploader
            label="Logo"
            value={logo}
            onChange={setLogo}
            existing={existingLogo}
            onRemoveExisting={() => {
              setExistingLogo([]);
              setRemoveLogo(true);
            }}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmId != null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId != null && del.mutate(confirmId)}
        title="Delete brand?"
        message="This will permanently delete the brand. Products with this brand will keep working but lose the brand link."
        destructive
        confirmLabel="Delete"
        loading={del.isPending}
      />
    </div>
  );
}
