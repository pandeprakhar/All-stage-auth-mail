import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { adminApi, AdminApiError, ADMIN_API_BASE } from "@/lib/admin-api";
import { PageHeader, Card } from "@/components/admin/ui";
import { Button } from "@/components/admin/Form";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/bulk-import")({
  component: BulkImportPage,
});

interface ImportResult {
  imported: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  errors?: { row: number; message: string }[];
}

function BulkImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"create" | "upsert">("upsert");
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a CSV or Excel file first");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      return adminApi.post<ImportResult>("/products/bulk-import", fd);
    },
    onSuccess: (res) => {
      setResult(res);
      toast.success(`Import finished — ${res.imported} imported`);
    },
    onError: (e) => toast.error(e instanceof AdminApiError ? e.message : (e as Error).message),
  });

  const acceptExt = ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bulk import products"
        description="Upload a CSV or Excel file to add or update many products at once."
        actions={
          <Link
            to="/admin/products"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="space-y-6">
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold">1. Get the template</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Download the sample file, fill in your data, and upload it below.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${ADMIN_API_BASE}/products/import-template?format=csv`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
            >
              <Download className="h-4 w-4" /> CSV template
            </a>
            <a
              href={`${ADMIN_API_BASE}/products/import-template?format=xlsx`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel template
            </a>
          </div>
          <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Required columns:</strong> name, sku, price, stock, status.{" "}
            <strong className="text-foreground">Optional:</strong> slug, discount_price, category, subcategory,
            brand, short_description, description, featured, image_urls (pipe-separated).
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">2. Choose mode</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                "cursor-pointer rounded-md border p-4 text-sm transition-colors",
                mode === "create" ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/30",
              )}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "create"}
                onChange={() => setMode("create")}
                className="mr-2"
              />
              <span className="font-medium">Create only</span>
              <p className="mt-1 text-xs text-muted-foreground">
                Skip rows whose SKU already exists.
              </p>
            </label>
            <label
              className={cn(
                "cursor-pointer rounded-md border p-4 text-sm transition-colors",
                mode === "upsert" ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/30",
              )}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "upsert"}
                onChange={() => setMode("upsert")}
                className="mr-2"
              />
              <span className="font-medium">Create or update (upsert)</span>
              <p className="mt-1 text-xs text-muted-foreground">
                Update existing products by SKU, create new ones.
              </p>
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">3. Upload file</h3>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center transition-colors hover:border-foreground/40",
              drag && "border-foreground/60 bg-muted/40",
            )}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">Click to browse</span> or drag & drop
            </div>
            <div className="text-xs text-muted-foreground">CSV, XLSX or XLS · up to 10MB</div>
            <input
              type="file"
              accept={acceptExt}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/products" })}>
              Cancel
            </Button>
            <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
              {upload.isPending ? "Importing…" : "Start import"}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-semibold">Import complete</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Imported" value={result.imported} tone="success" />
              <Stat label="Updated" value={result.updated ?? 0} tone="info" />
              <Stat label="Skipped" value={result.skipped ?? 0} />
              <Stat label="Failed" value={result.failed ?? 0} tone="danger" />
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Row errors
                </div>
                <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Row</th>
                        <th className="px-3 py-2 text-left font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.errors.map((er, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-mono text-xs">{er.row}</td>
                          <td className="px-3 py-1.5 text-red-600 dark:text-red-400">{er.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "info" | "danger";
}) {
  const tones: Record<string, string> = {
    success: "text-emerald-600 dark:text-emerald-400",
    info: "text-blue-600 dark:text-blue-400",
    danger: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold", tone && tones[tone])}>{value}</div>
    </div>
  );
}
