import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { adminApi, AdminApiError } from "@/lib/admin-api";
import { PageHeader, Pill } from "@/components/admin/ui";
import { Button, Field, Select } from "@/components/admin/Form";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Modal";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  size: string | null;
}

interface Order {
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
  items: OrderItem[];
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

function OrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Form states for status updates
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const list = useQuery({
    queryKey: ["admin", "orders", { page, perPage, search, statusFilter, paymentFilter }],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) p.set("search", search);
      if (statusFilter) p.set("order_status", statusFilter);
      if (paymentFilter) p.set("payment_status", paymentFilter);
      return adminApi.get<Paginated<Order>>(`/orders?${p.toString()}`);
    },
    retry: false,
  });

  const updateStatus = useMutation({
    mutationFn: (orderId: number) =>
      adminApi.put(`/orders/${orderId}`, {
        order_status: orderStatus,
        payment_status: paymentStatus,
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      setViewingOrder(null);
    },
    onError: (err) => {
      toast.error(err instanceof AdminApiError ? err.message : "Update failed");
    },
  });

  const openView = (order: Order) => {
    setOrderStatus(order.order_status);
    setPaymentStatus(order.payment_status);
    setViewingOrder(order);
  };

  const getOrderStatusPillVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "success";
      case "PROCESSING":
      case "SHIPPED":
        return "primary";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "danger";
      default:
        return "neutral";
    }
  };

  const getPaymentStatusPillVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "FAILED":
        return "danger";
      default:
        return "neutral";
    }
  };

  const columns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Order",
      render: (r) => (
        <div>
          <div className="font-mono text-xs font-bold text-foreground">{r.order_number}</div>
          <div className="text-[10px] text-muted-foreground">
            {new Date(r.created_at).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.shipping_name}</div>
          <div className="text-xs text-muted-foreground">{r.shipping_email}</div>
        </div>
      ),
    },
    {
      key: "products",
      header: "Products",
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
      key: "total_amount",
      header: "Total",
      render: (r) => <span className="font-semibold text-foreground">₹{r.total_amount.toLocaleString()}</span>,
    },
    {
      key: "order_status",
      header: "Status",
      render: (r) => <Pill variant={getOrderStatusPillVariant(r.order_status)}>{r.order_status}</Pill>,
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (r) => <Pill variant={getPaymentStatusPillVariant(r.payment_status)}>{r.payment_status}</Pill>,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      render: (r) => (
        <button onClick={() => openView(r)} className="text-muted-foreground hover:text-foreground">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Monitor customer sales and manage orders status." />

      <DataTable
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
        emptyText="No orders placed yet."
        filters={
          <>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 w-40"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 w-40"
            >
              <option value="">All Payments</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
            </Select>
          </>
        }
      />

      <Modal
        open={viewingOrder !== null}
        onClose={() => setViewingOrder(null)}
        title={viewingOrder ? `Order Details — ${viewingOrder.order_number}` : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setViewingOrder(null)}>
              Close
            </Button>
            {viewingOrder && (
              <Button
                onClick={() => updateStatus.mutate(viewingOrder.id)}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "Updating…" : "Update Status"}
              </Button>
            )}
          </>
        }
      >
        {viewingOrder && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Shipping & Contact
              </h3>
              <div className="rounded-md border border-border bg-muted/20 p-4 text-sm space-y-2">
                <div>
                  <strong>Name:</strong> {viewingOrder.shipping_name}
                </div>
                <div>
                  <strong>Email:</strong> {viewingOrder.shipping_email}
                </div>
                <div>
                  <strong>Phone:</strong> {viewingOrder.shipping_phone}
                </div>
                <div>
                  <strong>Address:</strong>
                  <div className="mt-1 text-muted-foreground whitespace-pre-line">
                    {viewingOrder.shipping_address}
                    {"\n"}
                    {viewingOrder.shipping_city} — {viewingOrder.shipping_pincode}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Order Status">
                  <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </Field>

                <Field label="Payment Status">
                  <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Order Items
              </h3>
              <div className="rounded-md border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-widest">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {viewingOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-foreground">{item.product_name}</div>
                          {item.size && (
                            <div className="text-[10px] text-muted-foreground">Size: {item.size}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/10 font-bold">
                      <td colSpan={3} className="px-3 py-2 text-right uppercase tracking-wider">
                        Total Amount
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">
                        ₹{viewingOrder.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
