// features/suppliers/SupplierDetails.tsx
import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";

// Types
interface Supplier {
  id: string;
  name: string;
  address: string;
  email: string;
  phone_number: string;
  secondary_number: string;
  phone_code: string;
  secondary_code: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  total_orders?: number;
  total_spent?: number;
  status?: "active" | "inactive";
}

interface SupplierDetailsProps {
  supplier: Supplier;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Mock order history data
interface Order {
  id: string;
  order_number: string;
  date: string;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  items: number;
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    order_number: "PO-2024-001",
    date: "2024-12-15",
    total: 1250.0,
    status: "completed",
    items: 5,
  },
  {
    id: "ORD-002",
    order_number: "PO-2024-002",
    date: "2024-12-10",
    total: 850.5,
    status: "processing",
    items: 3,
  },
  {
    id: "ORD-003",
    order_number: "PO-2024-003",
    date: "2024-12-05",
    total: 2100.0,
    status: "pending",
    items: 8,
  },
  {
    id: "ORD-004",
    order_number: "PO-2024-004",
    date: "2024-11-28",
    total: 450.75,
    status: "completed",
    items: 2,
  },
  {
    id: "ORD-005",
    order_number: "PO-2024-005",
    date: "2024-11-20",
    total: 3200.0,
    status: "cancelled",
    items: 10,
  },
];

const SupplierDetails = () => {
  const { modalRef, modalData } = useModal();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [orderLoading, setOrderLoading] = useState(false);
  const supplier = modalData?.supplier;
  // Helper functions
  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string | Date) => {
    if (!date) return "-";
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

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      inactive: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      colors[status || "inactive"] ||
      "bg-slate-100 text-slate-700 border-slate-200"
    );
  };

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      active: "Active",
      inactive: "Inactive",
    };
    return labels[status || "inactive"] || status;
  };

  const getOrderStatusColor = (status: Order["status"]) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      processing: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getOrderStatusLabel = (status: Order["status"]) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const getOrderStatusIcon = (status: Order["status"]) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-4 h-4" />,
      processing: <RefreshCw className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || null;
  };

  // Handler functions
  const handleEdit = async () => {
    modalRef?.close({ action: "edit", supplier });
  };

  const handleDelete = () => {};

  const handleRefreshOrders = () => {
    setOrderLoading(true);
    setTimeout(() => {
      setOrderLoading(false);
    }, 1000);
  };

  const handleExportOrders = () => {
    // TODO: Implement export functionality
    console.log("Exporting orders...");
  };

  // Stats cards
  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
  }> = ({ icon, label, value, color }) => (
    <div className="bg-background rounded-lg p-4 border border-border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-text-light">{label}</p>
          <p className="text-xl font-semibold text-text">{value}</p>
        </div>
      </div>
    </div>
  );

  // Info row component
  const InfoRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | React.ReactNode;
  }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="text-text-light mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-text-light">{label}</p>
        <p className="text-text font-medium">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">{supplier.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-light">{supplier.id}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                  supplier.status,
                )}`}
              >
                {getStatusLabel(supplier.status)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <button
            onClick={() => modalRef?.close({ action: "delete" })}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Total Orders"
            value={supplier.total_orders || 0}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={<CreditCard className="w-5 h-5" />}
            label="Total Spent"
            value={formatCurrency(supplier.total_spent)}
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Member Since"
            value={formatDate(supplier.created_at)}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Avg. Order Value"
            value={
              supplier.total_orders && supplier.total_spent
                ? formatCurrency(supplier.total_spent / supplier.total_orders)
                : "$0.00"
            }
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Tabs */}
        <div className="bg-background rounded-lg border border-border">
          <div className="border-b border-border">
            <div className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-primary text-white"
                    : "text-text-light hover:bg-background hover:text-text"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "orders"
                    ? "bg-primary text-white"
                    : "text-text-light hover:bg-background hover:text-text"
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "analytics"
                    ? "bg-primary text-white"
                    : "text-text-light hover:bg-background hover:text-text"
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-4">
                    Contact Information
                  </h3>
                  <div className="bg-card rounded-lg border border-border divide-y divide-border">
                    <InfoRow
                      icon={<Mail className="w-5 h-5" />}
                      label="Email Address"
                      value={
                        <a
                          href={`mailto:${supplier.email}`}
                          className="text-primary hover:underline"
                        >
                          {supplier.email}
                        </a>
                      }
                    />
                    <InfoRow
                      icon={<Phone className="w-5 h-5" />}
                      label="Primary Phone"
                      value={
                        <a
                          href={`tel:${supplier.phone_code}${supplier.phone_number}`}
                          className="text-primary hover:underline"
                        >
                          {supplier.phone_code} {supplier.phone_number}
                        </a>
                      }
                    />
                    {supplier.secondary_number && (
                      <InfoRow
                        icon={<Phone className="w-5 h-5" />}
                        label="Secondary Phone"
                        value={
                          <a
                            href={`tel:${supplier.secondary_code}${supplier.secondary_number}`}
                            className="text-primary hover:underline"
                          >
                            {supplier.secondary_code}{" "}
                            {supplier.secondary_number}
                          </a>
                        }
                      />
                    )}
                    <InfoRow
                      icon={<MapPin className="w-5 h-5" />}
                      label="Address"
                      value={supplier.address}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-4">
                    Additional Information
                  </h3>
                  <div className="bg-card rounded-lg border border-border divide-y divide-border">
                    <InfoRow
                      icon={<Building className="w-5 h-5" />}
                      label="Supplier ID"
                      value={supplier.id}
                    />
                    <InfoRow
                      icon={<Calendar className="w-5 h-5" />}
                      label="Date Added"
                      value={formatDateTime(supplier.created_at)}
                    />
                    {supplier.updated_at && (
                      <InfoRow
                        icon={<Clock className="w-5 h-5" />}
                        label="Last Updated"
                        value={formatDateTime(supplier.updated_at)}
                      />
                    )}
                    <InfoRow
                      icon={<Package className="w-5 h-5" />}
                      label="Total Orders"
                      value={supplier.total_orders || 0}
                    />
                    <InfoRow
                      icon={<DollarSign className="w-5 h-5" />}
                      label="Total Spent"
                      value={formatCurrency(supplier.total_spent)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-light uppercase tracking-wider">
                      Order History
                    </h3>
                    <p className="text-sm text-text-light mt-1">
                      {orders.length} orders found
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshOrders}
                      disabled={orderLoading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-1 ${orderLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportOrders}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>

                {orderLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader />
                    <span className="ml-3 text-text-light">
                      Loading orders...
                    </span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-text-light opacity-50 mx-auto mb-3" />
                    <p className="text-text-light">
                      No orders found for this supplier
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                            Order #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-background/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-text">
                                {order.order_number}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-text">
                              {formatDate(order.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-text">
                              {order.items}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-text">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(
                                  order.status,
                                )}`}
                              >
                                {getOrderStatusIcon(order.status)}
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                className="p-1 text-text-light hover:text-primary transition-colors"
                                title="View order details"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-text-light mb-2">
                      Order Trends
                    </h4>
                    <div className="h-48 flex items-center justify-center bg-background rounded-lg border border-border">
                      <p className="text-text-light text-sm">
                        Chart placeholder
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-text-light mb-2">
                      Spending Analysis
                    </h4>
                    <div className="h-48 flex items-center justify-center bg-background rounded-lg border border-border">
                      <p className="text-text-light text-sm">
                        Chart placeholder
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 text-center">
                    <p className="text-sm text-text-light">
                      Average Order Value
                    </p>
                    <p className="text-2xl font-bold text-text mt-1">
                      {supplier.total_orders && supplier.total_spent
                        ? formatCurrency(
                            supplier.total_spent / supplier.total_orders,
                          )
                        : "$0.00"}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-sm text-text-light">Order Frequency</p>
                    <p className="text-2xl font-bold text-text mt-1">
                      {supplier.created_at
                        ? `${Math.ceil(
                            (new Date().getTime() -
                              new Date(supplier.created_at).getTime()) /
                              (1000 * 60 * 60 * 24 * 30),
                          )} months`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-sm text-text-light">
                      Total Items Purchased
                    </p>
                    <p className="text-2xl font-bold text-text mt-1">
                      {orders.reduce((sum, order) => sum + order.items, 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;
