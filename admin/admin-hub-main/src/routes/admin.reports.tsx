import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  ShoppingBag,
  Users,
  Package,
  IndianRupee,
  AlertTriangle,
  Layers,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
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
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { PageHeader, Pill } from "@/components/admin/ui";
import { Button, Field, Input, Select } from "@/components/admin/Form";
import { DataTable, type Column } from "@/components/admin/DataTable";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

// ---------- Types ----------

interface SummaryData {
  total_customers: number;
  total_orders: number;
  total_products: number;
  total_categories: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  low_stock: number;
  out_of_stock: number;
}

interface ChartData {
  revenue_trend: { label: string; revenue: number; orders: number }[];
  top_products: { name: string; value: number; revenue: number }[];
  top_categories: { name: string; value: number; revenue: number }[];
  status_distribution: { name: string; value: number }[];
}

interface OrderReportRow {
  id: number;
  customer_id: number | null;
  customer_name: string | null;
  order_number: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_pincode: string;
  items: {
    product_name: string;
    quantity: number;
    price: number;
    size: string | null;
  }[];
  created_at: string;
}

interface CustomerReportRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  orders_count: number;
  total_spent: number;
  created_at: string;
  last_order_date: string | null;
}

interface ProductReportRow {
  id: number;
  name: string;
  sku: string;
  status: string;
  category_name: string | null;
  brand_name: string | null;
  current_stock: number;
  units_sold: number;
  revenue: number;
}

interface Category {
  id: number;
  name: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function ReportsPage() {
  // --- Date Range Presets and State ---
  const [datePreset, setDatePreset] = useState("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Other filter states
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Table pagination and search states
  const [activeTab, setActiveTab] = useState<"orders" | "customers" | "products">("orders");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Set date ranges automatically on preset change
  useEffect(() => {
    const today = new Date();
    let start = new Date();

    if (datePreset === "today") {
      start = today;
    } else if (datePreset === "7days") {
      start.setDate(today.getDate() - 6);
    } else if (datePreset === "30days") {
      start.setDate(today.getDate() - 29);
    } else if (datePreset === "thismonth") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      // Custom: don't auto-override if they are already custom
      return;
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDate(start));
    setEndDate(formatDate(today));
    setPage(1);
  }, [datePreset]);

  // Fetch Categories for product filter
  const { data: categories } = useQuery({
    queryKey: ["admin", "reports", "categories"],
    queryFn: () => adminApi.get<Category[]>("/categories"),
    retry: false,
  });

  // Fetch Summary statistics
  const summaryQuery = useQuery({
    queryKey: ["admin", "reports", "summary", { startDate, endDate }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return adminApi.get<SummaryData>(`/reports/summary?${params.toString()}`);
    },
    retry: false,
  });

  // Fetch Charts data
  const chartsQuery = useQuery({
    queryKey: ["admin", "reports", "charts", { startDate, endDate }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return adminApi.get<ChartData>(`/reports/charts?${params.toString()}`);
    },
    retry: false,
  });

  // Fetch Orders report table
  const ordersQuery = useQuery({
    queryKey: [
      "admin",
      "reports",
      "orders",
      { page, perPage, search, orderStatus, paymentStatus, startDate, endDate },
    ],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set("search", search);
      if (orderStatus) params.set("order_status", orderStatus);
      if (paymentStatus) params.set("payment_status", paymentStatus);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return adminApi.get<Paginated<OrderReportRow>>(`/reports/orders?${params.toString()}`);
    },
    retry: false,
  });

  // Fetch Customers report table
  const customersQuery = useQuery({
    queryKey: ["admin", "reports", "customers", { page, perPage, search, startDate, endDate }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set("search", search);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return adminApi.get<Paginated<CustomerReportRow>>(`/reports/customers?${params.toString()}`);
    },
    retry: false,
  });

  // Fetch Products report table
  const productsQuery = useQuery({
    queryKey: [
      "admin",
      "reports",
      "products",
      { page, perPage, search, categoryId, startDate, endDate },
    ],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set("search", search);
      if (categoryId) params.set("category_id", categoryId);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      return adminApi.get<Paginated<ProductReportRow>>(`/reports/products?${params.toString()}`);
    },
    retry: false,
  });

  const handleRefresh = () => {
    summaryQuery.refetch();
    chartsQuery.refetch();
    if (activeTab === "orders") ordersQuery.refetch();
    if (activeTab === "customers") customersQuery.refetch();
    if (activeTab === "products") productsQuery.refetch();
    toast.success("Report data refreshed.");
  };

  const handleExportPDF = () => {
    window.print();
  };

  // --- Columns definition ---

  const orderColumns: Column<OrderReportRow>[] = [
    {
      key: "order_number",
      header: "Order",
      render: (r) => <span className="font-mono text-xs font-bold text-foreground">{r.order_number}</span>,
    },
    {
      key: "customer_name",
      header: "Customer",
      render: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.shipping_name}</div>
          <div className="text-xs text-muted-foreground">{r.shipping_email}</div>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items Purchased",
      render: (r) => (
        <div className="max-w-xs space-y-0.5 text-xs text-muted-foreground">
          {r.items.map((item, idx) => (
            <div key={idx} className="truncate">
              {item.product_name} <span className="font-semibold text-foreground">x{item.quantity}</span>
              {item.size && <span className="ml-1 text-[10px] bg-muted px-1 py-0.2 rounded font-mono">({item.size})</span>}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (r) => <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "total_amount",
      header: "Amount",
      render: (r) => <span className="font-semibold text-foreground">₹{r.total_amount.toLocaleString()}</span>,
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (r) => (
        <Pill
          variant={
            r.payment_status.toUpperCase() === "PAID"
              ? "success"
              : r.payment_status.toUpperCase() === "PENDING"
              ? "warning"
              : "danger"
          }
        >
          {r.payment_status}
        </Pill>
      ),
    },
    {
      key: "order_status",
      header: "Order Status",
      render: (r) => (
        <Pill
          variant={
            r.order_status.toUpperCase() === "COMPLETED"
              ? "success"
              : r.order_status.toUpperCase() === "PENDING"
              ? "warning"
              : r.order_status.toUpperCase() === "CANCELLED"
              ? "danger"
              : "primary"
          }
        >
          {r.order_status}
        </Pill>
      ),
    },
  ];

  const customerColumns: Column<CustomerReportRow>[] = [
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
      header: "Orders Placed",
      render: (r) => <span className="font-semibold text-foreground">{r.orders_count}</span>,
    },
    {
      key: "total_spent",
      header: "Total Spent",
      render: (r) => <span className="font-semibold text-foreground">₹{r.total_spent.toLocaleString()}</span>,
    },
    {
      key: "created_at",
      header: "Registration",
      render: (r) => <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "last_order_date",
      header: "Last Order Date",
      render: (r) => (
        <span className="text-muted-foreground">
          {r.last_order_date ? new Date(r.last_order_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  const productColumns: Column<ProductReportRow>[] = [
    {
      key: "name",
      header: "Product Name",
      render: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.name}</div>
          <div className="text-xs text-muted-foreground">SKU: {r.sku}</div>
        </div>
      ),
    },
    {
      key: "category_name",
      header: "Category/Brand",
      render: (r) => (
        <div>
          <div className="text-xs font-semibold text-foreground">{r.category_name || "—"}</div>
          <div className="text-[10px] text-muted-foreground">{r.brand_name || "—"}</div>
        </div>
      ),
    },
    {
      key: "current_stock",
      header: "Stock",
      render: (r) => (
        <span
          className={
            r.current_stock <= 0
              ? "text-red-500 font-semibold"
              : r.current_stock <= 5
              ? "text-amber-500 font-semibold"
              : "text-foreground"
          }
        >
          {r.current_stock}
        </span>
      ),
    },
    {
      key: "units_sold",
      header: "Units Sold",
      render: (r) => <span className="font-semibold text-foreground">{r.units_sold}</span>,
    },
    {
      key: "revenue",
      header: "Revenue Generated",
      render: (r) => <span className="font-semibold text-foreground">₹{r.revenue.toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Pill variant={r.status.toUpperCase() === "ACTIVE" ? "success" : "neutral"}>
          {r.status}
        </Pill>
      ),
    },
  ];

  return (
    <div className="space-y-6 print-container">
      {/* Print Executive Header */}
      <div className="hidden print:block border-b-2 border-primary pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-display text-3xl tracking-tight text-primary font-bold">ALLSTAG</h1>
            <p className="text-xs text-muted-foreground font-mono">Executive Business Report</p>
          </div>
          <div className="text-right text-xs text-muted-foreground font-mono space-y-0.5">
            <div>
              <strong>Generated:</strong> {new Date().toLocaleString()}
            </div>
            <div>
              <strong>Period:</strong> {startDate || "All"} to {endDate || "All"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <PageHeader title="Reports" description="Comprehensive business performance and sales analytics." />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={handleExportPDF} className="h-9">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm print:hidden">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Field label="Date Range">
            <Select value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom Date Range</option>
            </Select>
          </Field>

          <Field label="Start Date">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
            />
          </Field>

          <Field label="End Date">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
            />
          </Field>

          <Field label="Order Status">
            <Select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>

          <Field label="Product Category">
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <SummaryCard
          title="Revenue"
          value={`₹${(summaryQuery.data?.total_revenue ?? 0).toLocaleString()}`}
          icon={IndianRupee}
          color="text-emerald-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Total Orders"
          value={summaryQuery.data?.total_orders ?? 0}
          icon={ShoppingBag}
          color="text-primary"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Completed"
          value={summaryQuery.data?.completed_orders ?? 0}
          icon={CheckCircle2}
          color="text-emerald-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Pending"
          value={summaryQuery.data?.pending_orders ?? 0}
          icon={Clock}
          color="text-amber-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Cancelled"
          value={summaryQuery.data?.cancelled_orders ?? 0}
          icon={XCircle}
          color="text-red-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Customers"
          value={summaryQuery.data?.total_customers ?? 0}
          icon={Users}
          color="text-indigo-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Products"
          value={summaryQuery.data?.total_products ?? 0}
          icon={Package}
          color="text-violet-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Categories"
          value={summaryQuery.data?.total_categories ?? 0}
          icon={Layers}
          color="text-sky-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Low Stock"
          value={summaryQuery.data?.low_stock ?? 0}
          icon={AlertTriangle}
          color="text-amber-500"
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Out of Stock"
          value={summaryQuery.data?.out_of_stock ?? 0}
          icon={AlertTriangle}
          color="text-red-500"
          loading={summaryQuery.isLoading}
        />
      </div>

      {/* Analytics Charts Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Revenue Trend & Sales Velocity
          </h3>
          <div className="h-72">
            {chartsQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading trend data…
              </div>
            ) : !chartsQuery.data?.revenue_trend || chartsQuery.data.revenue_trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No trend data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartsQuery.data.revenue_trend} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={11} stroke="currentColor" opacity={0.5} />
                  <YAxis fontSize={11} stroke="currentColor" opacity={0.5} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Order Status Distribution
          </h3>
          <div className="h-72 flex flex-col items-center justify-center">
            {chartsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading distribution…</div>
            ) : !chartsQuery.data?.status_distribution || chartsQuery.data.status_distribution.length === 0 ? (
              <div className="text-sm text-muted-foreground">No orders in this period.</div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsQuery.data.status_distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {chartsQuery.data.status_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(val) => [val, "Orders"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-medium mt-2">
                  {chartsQuery.data.status_distribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{entry.name}:</span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Top Selling Products
          </h3>
          <div className="h-72">
            {chartsQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading products…
              </div>
            ) : !chartsQuery.data?.top_products || chartsQuery.data.top_products.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No sales recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsQuery.data.top_products} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" fontSize={11} stroke="currentColor" opacity={0.5} />
                  <YAxis dataKey="name" type="category" fontSize={10} stroke="currentColor" width={90} opacity={0.7} />
                  <ChartTooltip formatter={(v) => [v, "Units Sold"]} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {chartsQuery.data.top_products.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#0ea5e9" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Selling Categories */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Top Performing Categories (Revenue)
          </h3>
          <div className="h-72">
            {chartsQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading categories…
              </div>
            ) : !chartsQuery.data?.top_categories || chartsQuery.data.top_categories.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No sales recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsQuery.data.top_categories} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} stroke="currentColor" opacity={0.5} />
                  <YAxis fontSize={11} stroke="currentColor" opacity={0.5} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Reports Tables section */}
      <div className="space-y-4 print:hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-border print:hidden">
          <TabButton
            active={activeTab === "orders"}
            onClick={() => {
              setActiveTab("orders");
              setSearch("");
              setPage(1);
            }}
          >
            Orders Report
          </TabButton>
          <TabButton
            active={activeTab === "customers"}
            onClick={() => {
              setActiveTab("customers");
              setSearch("");
              setPage(1);
            }}
          >
            Customers Report
          </TabButton>
          <TabButton
            active={activeTab === "products"}
            onClick={() => {
              setActiveTab("products");
              setSearch("");
              setPage(1);
            }}
          >
            Products Performance
          </TabButton>
        </div>

        {/* Tab Tables content */}
        <div>
          {activeTab === "orders" && (
            <DataTable
              columns={orderColumns}
              rows={ordersQuery.data?.data ?? []}
              total={ordersQuery.data?.total ?? 0}
              page={page}
              perPage={perPage}
              loading={ordersQuery.isLoading}
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
              emptyText="No matching orders found."
            />
          )}

          {activeTab === "customers" && (
            <DataTable
              columns={customerColumns}
              rows={customersQuery.data?.data ?? []}
              total={customersQuery.data?.total ?? 0}
              page={page}
              perPage={perPage}
              loading={customersQuery.isLoading}
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
              emptyText="No matching customers found."
            />
          )}

          {activeTab === "products" && (
            <DataTable
              columns={productColumns}
              rows={productsQuery.data?.data ?? []}
              total={productsQuery.data?.total ?? 0}
              page={page}
              perPage={perPage}
              loading={productsQuery.isLoading}
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
              emptyText="No matching products found."
            />
          )}
        </div>
      </div>

      {/* Print-Only Section for PDF Exports */}
      <div className="hidden print:block space-y-8 mt-8">
        {/* Orders Print Table */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-1">Orders Report</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-2">Order</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Items Purchased</th>
                <th className="py-2">Date</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2">Payment</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[11px]">
              {(ordersQuery.data?.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="py-2 font-mono font-bold">{r.order_number}</td>
                  <td className="py-2">
                    <div>{r.shipping_name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.shipping_email}</div>
                  </td>
                  <td className="py-2 text-muted-foreground text-[10px]">
                    {r.items.map((item, idx) => (
                      <div key={idx}>
                        {item.product_name} x{item.quantity} {item.size ? `(${item.size})` : ''}
                      </div>
                    ))}
                  </td>
                  <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 text-right font-semibold">₹{r.total_amount.toLocaleString()}</td>
                  <td className="py-2">{r.payment_status}</td>
                  <td className="py-2">{r.order_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customers Print Table */}
        <div className="space-y-3 pt-6" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-base font-bold text-foreground border-b border-border pb-1">Customers Report</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-2">Customer</th>
                <th className="py-2">Phone</th>
                <th className="py-2 text-center">Orders</th>
                <th className="py-2 text-right">Total Spent</th>
                <th className="py-2">Registration</th>
                <th className="py-2">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[11px]">
              {(customersQuery.data?.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="py-2">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="py-2">{r.phone || "—"}</td>
                  <td className="py-2 text-center">{r.orders_count}</td>
                  <td className="py-2 text-right font-semibold">₹{r.total_spent.toLocaleString()}</td>
                  <td className="py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2">{r.last_order_date ? new Date(r.last_order_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Products Print Table */}
        <div className="space-y-3 pt-6" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-base font-bold text-foreground border-b border-border pb-1">Products Performance</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-2">Product Name</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-center">Stock</th>
                <th className="py-2 text-center">Units Sold</th>
                <th className="py-2 text-right">Revenue</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[11px]">
              {(productsQuery.data?.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="py-2">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground">SKU: {r.sku}</div>
                  </td>
                  <td className="py-2">{r.category_name || "—"}</td>
                  <td className="py-2 text-center">{r.current_stock}</td>
                  <td className="py-2 text-center">{r.units_sold}</td>
                  <td className="py-2 text-right font-semibold">₹{r.revenue.toLocaleString()}</td>
                  <td className="py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block border-t border-border mt-12 pt-4 text-center text-[10px] text-muted-foreground font-mono">
        Allstag Admin Insights Hub. Generated automatically by system admin. Page 1 of 1.
      </div>

      {/* Custom print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide sidebar, headers, backdrops and control panels */
          .print\\:hidden, 
          aside, 
          nav, 
          header, 
          footer,
          button,
          .bg-card,
          input,
          select {
            display: none !important;
          }
          /* Force charts, dashboard elements, and tables full page */
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .grid {
            display: grid !important;
            gap: 1.5rem !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
          /* Summaries print layout: 5 cols */
          .grid-cols-2 {
            grid-template-columns: repeat(5, 1fr) !important;
          }
          .rounded-lg, .border, .shadow-sm {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- Local Helpers ---

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors outline-none ${
        active
          ? "border-b-2 border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-6 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
        )}
      </div>
    </div>
  );
}
