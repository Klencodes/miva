// features/suppliers/SupplierDetails.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ShoppingBag,
  CreditCard,
  MoreVertical,
  Download,
  RefreshCw,
  Loader,
  Globe,
  TrendingUp,
  BarChart2,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { toast } from "sonner";
import SupplierService from "../../core/services/supplier";
import ConfirmModal from "../../components/common/ConfirmModal";

interface Order {
  id: string;
  order_number: string;
  date: string;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  items: number;
}

/* ─── Tiny helpers ─────────────────────────────────────────── */

const formatDate = (date?: string | Date) => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (date?: string | Date) => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount?: number) => {
  if (!amount) return "$0.00";
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ORDER_STATUS = {
  pending: {
    label: "Pending",
    bg: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    icon: <Clock className="w-3 h-3" />,
  },
  processing: {
    label: "Processing",
    bg: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
    icon: <RefreshCw className="w-3 h-3" />,
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-400",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-100 text-red-700",
    dot: "bg-red-400",
    icon: <XCircle className="w-3 h-3" />,
  },
};


const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}> = ({ icon, label, value, accent }) => (
  <div className="flex items-center gap-3 p-4  border border-border bg-background">
    <div className={`p-2.5  ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-text-light truncate">{label}</p>
      <p className="text-lg font-bold text-text leading-tight truncate">
        {value}
      </p>
    </div>
  </div>
);

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    <span className="mt-0.5 text-text-light shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-text-light mb-0.5">{label}</p>
      <div className="text-sm font-medium text-text break-words">{value}</div>
    </div>
  </div>
);

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <p className="text-xs font-semibold uppercase tracking-widest text-text-light mb-3">
    {children}
  </p>
);

const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({
  icon,
  message,
}) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-light">
    <span className="opacity-30 scale-150">{icon}</span>
    <p className="text-sm">{message}</p>
  </div>
);

/* ─── Main Component ───────────────────────────────────────── */

const SupplierDetails = () => {
  const { modalRef, modalData } = useModal();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [supplierStats, setSupplierStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { openModal } = useModal();
  const supplier = modalData?.supplier;

  const fetchSupplierData = useCallback(async () => {
    if (!supplier?.uuid) return;
    setOrderLoading(true);
    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        SupplierService.getSupplierOrders(supplier.uuid, { limit: 50 }),
        SupplierService.getSupplierStats(supplier.uuid),
      ]);
      if (ordersResponse.success)
        setOrders(ordersResponse.results?.orders || []);
      if (statsResponse.success) setSupplierStats(statsResponse.results);
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load supplier data",
      });
    } finally {
      setOrderLoading(false);
    }
  }, [supplier?.uuid]);

  useEffect(() => {
    fetchSupplierData();
  }, [fetchSupplierData]);

  const handleEdit = () => modalRef?.close({ action: "edit", supplier });

  const handleDelete = async () => {
    try {
      const result = await openModal(ConfirmModal, {
        data: {
          title: "Delete Supplier",
          message: `Are you sure you want to delete "${supplier.name}"? This cannot be undone`,
        },
      });
      if (result?.confirmed) {
        setLoading(true);
        const response = await SupplierService.deleteSupplier(supplier.uuid);
        if (response.success) {
          toast.success("Deleted", {
            description: "Supplier removed successfully.",
          });
          modalRef?.close({ action: "delete", success: true });
        }
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to delete supplier",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrders = async () => {
    if (!supplier?.uuid) return;
    try {
      const blob = await SupplierService.exportSuppliers({
        format: "excel",
        date_from: new Date(
          new Date().setMonth(new Date().getMonth() - 6),
        ).toISOString(),
        date_to: new Date().toISOString(),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `supplier-orders-${supplier.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Exported", { description: "Orders downloaded as Excel." });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to export orders",
      });
    }
  };

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-text-light text-sm">No supplier data available</p>
      </div>
    );
  }

  const stats = supplierStats || {
    total_orders: supplier.total_orders || 0,
    total_spent: supplier.total_spent || 0,
  };
  const avgOrder =
    stats.total_orders && stats.total_spent
      ? stats.total_spent / stats.total_orders
      : 0;
  const totalItems = orders.reduce((s, o) => s + o.items, 0);
  const isActive = supplier.status === "active";

  const TABS = [
    { id: "overview", label: "Overview" },
    {
      id: "orders",
      label: `Orders${orders.length ? ` (${orders.length})` : ""}`,
    },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-6 pb-0 border-b border-border bg-background/60">
        {/* top row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4 min-w-0">
            {/* <Avatar name={supplier.name || "?"} size="lg" /> */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-text leading-tight truncate">
                  {supplier.name}
                </h2>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {/* <p className="text-xs text-text-light mt-0.5 font-mono">
                {supplier.id || supplier.uuid?.slice(0, 8)}
              </p> */}
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              {loading ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </Button>
            <button
              onClick={() => modalRef?.close()}
              className="p-1.5 text-text-light hover:text-text hover:bg-background  transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* stat pills row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Orders"
            value={stats.total_orders || 0}
            accent="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={<CreditCard className="w-4 h-4" />}
            label="Total Spent"
            value={formatCurrency(stats.total_spent)}
            accent="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Avg. Order"
            value={formatCurrency(avgOrder)}
            accent="bg-violet-100 text-violet-600"
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="Since"
            value={formatDate(supplier.created_at)}
            accent="bg-amber-100 text-amber-600"
          />
        </div>

        {/* tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all duration-150 ${
                activeTab === t.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-text-light hover:text-text hover:bg-background/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── Overview ──────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Contact */}
            <div>
              <SectionHeading>Contact</SectionHeading>
              <div className=" border border-border bg-background overflow-hidden divide-y divide-border p-3">
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={
                    supplier.email ? (
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {supplier.email} <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Primary Phone"
                  value={
                    supplier.phone_number ? (
                      <a
                        href={`tel:${supplier.phone_code || ""}${supplier.phone_number}`}
                        className="text-primary hover:underline"
                      >
                        {supplier.phone_code} {supplier.phone_number}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                {supplier.secondary_number && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="Secondary Phone"
                    value={
                      <a
                        href={`tel:${supplier.secondary_code || ""}${supplier.secondary_number}`}
                        className="text-primary hover:underline"
                      >
                        {supplier.secondary_code} {supplier.secondary_number}
                      </a>
                    }
                  />
                )}
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Address"
                  value={supplier.address || "—"}
                />
                {supplier.website && (
                  <InfoRow
                    icon={<Globe className="w-4 h-4" />}
                    label="Website"
                    value={
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {supplier.website} <ArrowUpRight className="w-3 h-3" />
                      </a>
                    }
                  />
                )}
              </div>
            </div>

            {/* Legal */}
            {(supplier.tax_id || supplier.registration_number) && (
              <div>
                <SectionHeading>Legal</SectionHeading>
                <div className=" border border-border bg-background overflow-hidden divide-y divide-border">
                  {supplier.tax_id && (
                    <InfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="Tax ID"
                      value={supplier.tax_id}
                    />
                  )}
                  {supplier.registration_number && (
                    <InfoRow
                      icon={<Building className="w-4 h-4" />}
                      label="Registration Number"
                      value={supplier.registration_number}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Meta */}
            <div>
              <SectionHeading>Record</SectionHeading>
              <div className=" border border-border bg-background overflow-hidden divide-y divide-border p-3">
                {/* <InfoRow icon={<Building className="w-4 h-4" />} label="Supplier ID" value={<span className="font-mono text-xs">{supplier.id || supplier.uuid?.slice(0, 8) || "—"}</span>} /> */}
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Added"
                  value={formatDateTime(supplier.created_at)}
                />
                {supplier.updated_at && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label="Last Updated"
                    value={formatDateTime(supplier.updated_at)}
                  />
                )}
                <InfoRow
                  icon={<Package className="w-4 h-4" />}
                  label="Total Orders"
                  value={stats.total_orders || 0}
                />
                <InfoRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Total Spent"
                  value={formatCurrency(stats.total_spent)}
                />
              </div>
            </div>

            {/* Notes */}
            {supplier.notes && (
              <div>
                <SectionHeading>Notes</SectionHeading>
                <div className=" border border-border bg-background px-4 py-3">
                  <p className="text-sm text-text leading-relaxed">
                    {supplier.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Orders ────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-4 p-3">
              <p className="text-sm text-text-light">
                {orders.length} order{orders.length !== 1 ? "s" : ""} on record
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSupplierData}
                  disabled={orderLoading}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${orderLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportOrders}
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>

            {orderLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-text-light">
                <Loader className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm">Loading orders…</span>
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="w-10 h-10" />}
                message="No orders found for this supplier"
              />
            ) : (
              <div className=" border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      {["Order #", "Date", "Items", "Total", "Status", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wider ${h === "" ? "text-right" : "text-left"}`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {orders.map((order) => {
                      const s =
                        ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-background/60 transition-colors group"
                        >
                          <td className="px-4 py-3 font-mono font-medium text-text">
                            {order.order_number}
                          </td>
                          <td className="px-4 py-3 text-text-light">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-4 py-3 text-text">{order.items}</td>
                          <td className="px-4 py-3 font-semibold text-text">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg}`}
                            >
                              {s.icon}
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-text-light hover:text-primary transition-all  hover:bg-primary/10">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ─────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Average Order Value",
                  value: formatCurrency(avgOrder),
                  icon: <TrendingUp className="w-5 h-5" />,
                  accent: "bg-violet-100 text-violet-600",
                },
                {
                  label: "Total Items Purchased",
                  value: totalItems,
                  icon: <Package className="w-5 h-5" />,
                  accent: "bg-blue-100 text-blue-600",
                },
                {
                  label: "Months as Supplier",
                  value: supplier.created_at
                    ? Math.ceil(
                        (Date.now() - new Date(supplier.created_at).getTime()) /
                          (1000 * 60 * 60 * 24 * 30),
                      )
                    : "—",
                  icon: <Calendar className="w-5 h-5" />,
                  accent: "bg-amber-100 text-amber-600",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className=" border border-border bg-background p-5 flex flex-col gap-3"
                >
                  <div className={`self-start p-2  ${k.accent}`}>{k.icon}</div>
                  <div>
                    <p className="text-xs text-text-light">{k.label}</p>
                    <p className="text-2xl font-bold text-text mt-0.5">
                      {k.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            {orders.length > 0 && (
              <div>
                <SectionHeading>Order Status Breakdown</SectionHeading>
                <div className=" border border-border bg-background p-5 space-y-3">
                  {(
                    ["completed", "processing", "pending", "cancelled"] as const
                  ).map((status) => {
                    const count = orders.filter(
                      (o) => o.status === status,
                    ).length;
                    const pct = orders.length
                      ? Math.round((count / orders.length) * 100)
                      : 0;
                    const s = ORDER_STATUS[status];
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-28 shrink-0 ${s.bg}`}
                        >
                          {s.icon}
                          {s.label}
                        </span>
                        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.dot} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-text-light w-14 text-right shrink-0">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spend chart placeholder */}
            <div>
              <SectionHeading>Spending Over Time</SectionHeading>
              <div className=" border border-border bg-background h-44 flex flex-col items-center justify-center gap-2 text-text-light">
                <BarChart2 className="w-8 h-8 opacity-30" />
                <p className="text-sm">Chart coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDetails;
