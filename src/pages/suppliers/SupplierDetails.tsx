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
} from "lucide-react";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { toast } from "sonner";
import SupplierService from "../../core/services/supplier";

// Order interface
interface Order {
  id: string;
  order_number: string;
  date: string;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  items: number;
}

const SupplierDetails = () => {
  const { modalRef, modalData } = useModal();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [supplierStats, setSupplierStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const supplier = modalData?.supplier;

  // Fetch supplier orders and stats
  const fetchSupplierData = useCallback(async () => {
    if (!supplier?.uuid) return;

    setOrderLoading(true);
    try {
      // Fetch orders
      const ordersResponse = await SupplierService.getSupplierOrders(supplier.uuid, {
        limit: 50,
      });
      
      if (ordersResponse.success) {
        setOrders(ordersResponse.results?.orders || []);
      }

      // Fetch stats
      const statsResponse = await SupplierService.getSupplierStats(supplier.uuid);
      if (statsResponse.success) {
        setSupplierStats(statsResponse.results);
      }
    } catch (error: any) {
      console.error("Error fetching supplier data:", error);
      toast.error("Error", {
        description: error.message || "Failed to load supplier data",
      });
    } finally {
      setOrderLoading(false);
    }
  }, [supplier?.uuid]);

  // Load data on mount
  useEffect(() => {
    fetchSupplierData();
  }, [fetchSupplierData]);

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

  const handleDelete = async () => {
    if (!supplier?.uuid) return;
    
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      setLoading(true);
      try {
        const response = await SupplierService.deleteSupplier(supplier.uuid);
        if (response.success) {
          toast.success("Success", {
            description: "Supplier deleted successfully",
          });
          modalRef?.close({ action: "delete", success: true });
        }
      } catch (error: any) {
        toast.error("Error", {
          description: error.message || "Failed to delete supplier",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefreshOrders = () => {
    fetchSupplierData();
  };

  const handleExportOrders = async () => {
    if (!supplier?.uuid) return;
    
    try {
      const blob = await SupplierService.exportSuppliers({
        format: 'excel',
        date_from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
        date_to: new Date().toISOString(),
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `supplier-orders-${supplier.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Success", {
        description: "Orders exported successfully",
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to export orders",
      });
    }
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

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-text-light">No supplier data available</p>
      </div>
    );
  }

  // Use stats from API or fallback to supplier data
  const stats = supplierStats || {
    total_orders: supplier.total_orders || 0,
    total_spent: supplier.total_spent || 0,
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {supplier.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">{supplier.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-light">
                {supplier.id || supplier.uuid?.slice(0, 8)}
              </span>
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
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <button
            onClick={() => modalRef?.close()}
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
            value={stats.total_orders || 0}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={<CreditCard className="w-5 h-5" />}
            label="Total Spent"
            value={formatCurrency(stats.total_spent)}
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
              stats.total_orders && stats.total_spent
                ? formatCurrency(stats.total_spent / stats.total_orders)
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
                          {supplier.email || "N/A"}
                        </a>
                      }
                    />
                    <InfoRow
                      icon={<Phone className="w-5 h-5" />}
                      label="Primary Phone"
                      value={
                        supplier.phone_number ? (
                          <a
                            href={`tel:${supplier.phone_code || ""}${supplier.phone_number}`}
                            className="text-primary hover:underline"
                          >
                            {supplier.phone_code || ""} {supplier.phone_number}
                          </a>
                        ) : (
                          "N/A"
                        )
                      }
                    />
                    {supplier.secondary_number && (
                      <InfoRow
                        icon={<Phone className="w-5 h-5" />}
                        label="Secondary Phone"
                        value={
                          <a
                            href={`tel:${supplier.secondary_code || ""}${supplier.secondary_number}`}
                            className="text-primary hover:underline"
                          >
                            {supplier.secondary_code || ""}{" "}
                            {supplier.secondary_number}
                          </a>
                        }
                      />
                    )}
                    <InfoRow
                      icon={<MapPin className="w-5 h-5" />}
                      label="Address"
                      value={supplier.address || "N/A"}
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
                      value={supplier.id || supplier.uuid?.slice(0, 8) || "N/A"}
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
                      value={stats.total_orders || 0}
                    />
                    <InfoRow
                      icon={<DollarSign className="w-5 h-5" />}
                      label="Total Spent"
                      value={formatCurrency(stats.total_spent)}
                    />
                    {supplier.website && (
                      <InfoRow
                        icon={<Globe className="w-5 h-5" />}
                        label="Website"
                        value={
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {supplier.website}
                          </a>
                        }
                      />
                    )}
                    {supplier.tax_id && (
                      <InfoRow
                        icon={<FileText className="w-5 h-5" />}
                        label="Tax ID"
                        value={supplier.tax_id}
                      />
                    )}
                    {supplier.registration_number && (
                      <InfoRow
                        icon={<FileText className="w-5 h-5" />}
                        label="Registration Number"
                        value={supplier.registration_number}
                      />
                    )}
                    {supplier.notes && (
                      <InfoRow
                        icon={<FileText className="w-5 h-5" />}
                        label="Notes"
                        value={supplier.notes}
                      />
                    )}
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
                    <Loader className="animate-spin w-6 h-6 text-primary" />
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
                      {stats.total_orders && stats.total_spent
                        ? formatCurrency(
                            stats.total_spent / stats.total_orders,
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