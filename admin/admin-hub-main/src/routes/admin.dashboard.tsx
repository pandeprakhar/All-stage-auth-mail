import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  IndianRupee,
  Users,
  Package,
  FolderTree,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

// ---------- Types the backend is expected to return ----------

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  approved_orders: number;
  delivered_orders: number;
  revenue: number;
  customers: number;
  products: number;
  categories: number;
  monthly_sales: number;
  visitors?: number;
  // % change vs previous period (optional)
  deltas?: Partial<Record<
    | "total_orders"
    | "pending_orders"
    | "approved_orders"
    | "delivered_orders"
    | "revenue"
    | "customers"
    | "products"
    | "categories"
    | "monthly_sales"
    | "visitors",
    number
  >>;
}

interface RevenuePoint { label: string; revenue: number; orders: number }
interface CategorySlice { name: string; value: number }
interface RecentOrder {
  id: string | number;
  code?: string;
  customer_name: string;
  amount: number;
  status: string;
  created_at: string;
}
interface LowStockItem {
  id: string | number;
  name: string;
  sku?: string;
  stock: number;
}

// ---------- Formatters ----------

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const num = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0);

// ---------- Page ----------

function DashboardPage() {
  const stats = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => adminApi.get<DashboardStats>("/dashboard/stats"),
    retry: false,
  });

  const revenue = useQuery({
    queryKey: ["admin", "dashboard", "revenue"],
    queryFn: () => adminApi.get<RevenuePoint[]>("/dashboard/revenue?range=30d"),
    retry: false,
  });

  const categories = useQuery({
    queryKey: ["admin", "dashboard", "categories"],
    queryFn: () => adminApi.get<CategorySlice[]>("/dashboard/categories"),
    retry: false,
  });

  const recent = useQuery({
    queryKey: ["admin", "dashboard", "recent-orders"],
    queryFn: () => adminApi.get<RecentOrder[]>("/orders?limit=6&sort=-created_at"),
    retry: false,
  });

  const lowStock = useQuery({
    queryKey: ["admin", "dashboard", "low-stock"],
    queryFn: () => adminApi.get<LowStockItem[]>("/products/low-stock?limit=6"),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live snapshot of orders, revenue and catalog health.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {stats.isError && <ApiHint error={stats.error} />}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Orders"
          value={stats.data ? num(stats.data.total_orders) : "—"}
          delta={stats.data?.deltas?.total_orders}
          icon={ShoppingBag}
          loading={stats.isLoading}
        />
        <KpiCard
          label="Pending"
          value={stats.data ? num(stats.data.pending_orders) : "—"}
          delta={stats.data?.deltas?.pending_orders}
          icon={Clock}
          loading={stats.isLoading}
          tone="warning"
        />
        <KpiCard
          label="Approved"
          value={stats.data ? num(stats.data.approved_orders) : "—"}
          delta={stats.data?.deltas?.approved_orders}
          icon={CheckCircle2}
          loading={stats.isLoading}
          tone="success"
        />
        <KpiCard
          label="Delivered"
          value={stats.data ? num(stats.data.delivered_orders) : "—"}
          delta={stats.data?.deltas?.delivered_orders}
          icon={Truck}
          loading={stats.isLoading}
        />
        <KpiCard
          label="Revenue"
          value={stats.data ? inr(stats.data.revenue) : "—"}
          delta={stats.data?.deltas?.revenue}
          icon={IndianRupee}
          loading={stats.isLoading}
          tone="success"
        />
        <KpiCard
          label="Customers"
          value={stats.data ? num(stats.data.customers) : "—"}
          delta={stats.data?.deltas?.customers}
          icon={Users}
          loading={stats.isLoading}
        />
        <KpiCard
          label="Products"
          value={stats.data ? num(stats.data.products) : "—"}
          delta={stats.data?.deltas?.products}
          icon={Package}
          loading={stats.isLoading}
        />
        <KpiCard
          label="Categories"
          value={stats.data ? num(stats.data.categories) : "—"}
          delta={stats.data?.deltas?.categories}
          icon={FolderTree}
          loading={stats.isLoading}
        />
        <KpiCard
          label="Monthly Sales"
          value={stats.data ? inr(stats.data.monthly_sales) : "—"}
          delta={stats.data?.deltas?.monthly_sales}
          icon={TrendingUp}
          loading={stats.isLoading}
        />
        <KpiCard
          label="Visitors"
          value={stats.data?.visitors != null ? num(stats.data.visitors) : "—"}
          delta={stats.data?.deltas?.visitors}
          icon={Users}
          loading={stats.isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Revenue"
          subtitle="Last 30 days"
          className="lg:col-span-2"
          loading={revenue.isLoading}
          empty={!revenue.isLoading && !(revenue.data && revenue.data.length)}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.data ?? []}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => inr(Number(v))} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v: number, k) => (k === "revenue" ? [inr(v), "Revenue"] : [num(v), "Orders"])}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="currentColor"
                  strokeWidth={2}
                  fill="url(#revFill)"
                  className="text-foreground"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Category mix"
          subtitle="Sales share"
          loading={categories.isLoading}
          empty={!categories.isLoading && !(categories.data && categories.data.length)}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories.data ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {(categories.data ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Order volume (bar) */}
      <Panel
        title="Order volume"
        subtitle="Orders per day, last 30 days"
        loading={revenue.isLoading}
        empty={!revenue.isLoading && !(revenue.data && revenue.data.length)}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="orders" fill="currentColor" radius={[3, 3, 0, 0]} className="text-foreground/70" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Recent orders + low stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Recent orders"
          subtitle="Latest activity"
          loading={recent.isLoading}
          empty={!recent.isLoading && !(recent.data && recent.data.length)}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(recent.data ?? []).map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="py-2.5 font-mono text-xs">{o.code ?? `#${o.id}`}</td>
                    <td className="py-2.5">{o.customer_name}</td>
                    <td className="py-2.5">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="py-2.5 text-right font-medium">{inr(o.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Low stock"
          subtitle="Restock these soon"
          loading={lowStock.isLoading}
          empty={!lowStock.isLoading && !(lowStock.data && lowStock.data.length)}
        >
          <ul className="divide-y divide-border">
            {(lowStock.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  {p.sku && (
                    <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                  )}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                    p.stock <= 0
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : p.stock < 5
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-foreground/80",
                  )}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {p.stock} left
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ---------- Sub components ----------

const PIE_COLORS = ["#111827", "#4b5563", "#9ca3af", "#d1d5db", "#6b7280", "#374151"];

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  loading,
  tone,
}: {
  label: string;
  value: string;
  delta?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  tone?: "success" | "warning";
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "grid h-8 w-8 place-items-center rounded-md",
            tone === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            tone === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            !tone && "bg-muted text-foreground/80",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">
        {loading ? <span className="inline-block h-6 w-20 animate-pulse rounded bg-muted" /> : value}
      </div>
      {delta != null && (
        <div
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className,
  loading,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4 lg:p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      {loading ? (
        <div className="h-40 animate-pulse rounded-md bg-muted/50" />
      ) : empty ? (
        <div className="grid h-40 place-items-center text-xs text-muted-foreground">
          No data yet.
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    packed: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
    refunded: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };
  const cls = map[s] ?? "bg-muted text-foreground/80";
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize", cls)}>
      {status}
    </span>
  );
}

function ApiHint({ error }: { error: unknown }) {
  const msg = error instanceof AdminApiError ? error.message : "Could not load dashboard data.";
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
      <strong className="font-semibold">Backend not reachable:</strong> {msg} Set{" "}
      <code className="rounded bg-black/10 px-1 py-0.5">VITE_ADMIN_API_URL</code> in{" "}
      <code>.env</code> to your PHP admin API base URL and restart dev.
    </div>
  );
}
