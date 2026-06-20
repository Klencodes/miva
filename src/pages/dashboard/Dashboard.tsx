import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardService from "../../core/services/dashboard";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Users,
  FileText,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useStore } from "../../core/contexts/StoreProvider";
import { eventService } from "../../core/services/events";
import { DashboardStats } from "../../core/types";
import { Input } from "../../components/common";

// ─── Color Palette ──────────────────────────────────────────────────────────
const COLORS = {
  primary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
  teal: "#14B8A6",
  indigo: "#6366F1",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.purple,
  COLORS.pink,
  COLORS.orange,
];

// ─── Stat Card Component ──────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  subtitle?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = COLORS.primary,
}) => {
  return (
    <div className="bg-card border border-border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-light">{title}</p>
          <p className="text-2xl font-bold text-text mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-light mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === "up" ? (
                <ArrowUp className="w-4 h-4 text-emerald-500" />
              ) : trend.direction === "down" ? (
                <ArrowDown className="w-4 h-4 text-red-500" />
              ) : null}
              <span
                className={`text-xs font-medium ${
                  trend.direction === "up"
                    ? "text-emerald-500"
                    : trend.direction === "down"
                      ? "text-red-500"
                      : "text-text-light"
                }`}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-text-light">from last month</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, entity } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [stats, setStats] = useState<DashboardStats>({
    inventory: {
      total_items: 0,
      total_quantity: 0,
      total_value: 0,
      total_price: 0,
      avg_cost: 0,
      avg_price: 0,
    },
    invoices: {
      total_invoices: 0,
      total_amount: 0,
      total_paid: 0,
      total_remaining: 0,
    },
    recent_transactions: [],
    weekly_sales: [],
    top_selling_items: [],
    inventory_by_type: [],
    low_stock_count: {
      low_stock: 0,
      out_of_stock: 0,
      total: 0,
    },
    invoice_status_breakdown: {
      draft: { count: 0, amount: 0 },
      quoted: { count: 0, amount: 0 },
      invoiced: { count: 0, amount: 0 },
      partially_paid: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
    },
  });

  // ── Fetch Dashboard Data ──────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (dateRange.start) {
        params.date_from = dateRange.start.toISOString();
      }
      if (dateRange.end) {
        params.date_to = dateRange.end.toISOString();
      }

      const response = await DashboardService.getDashboardStats(params);

      if (response.success) {
        setStats(response.results);
      } else {
        toast.error("Error", {
          description: response.message || "Failed to load dashboard data",
        });
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error", {
        description: error.message || "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchDashboardData]);

  // ── Refresh Handler ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    toast.success("Success", { description: "Dashboard refreshed" });
  };

  // ── Helper to get status label ──────────────────────────────────────────
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft",
      quoted: "Quoted",
      invoiced: "Invoiced",
      partially_paid: "Partially Paid",
      paid: "Paid",
      cancelled: "Cancelled",
      overdue: "Overdue",
    };
    return labels[status] || status;
  };

  // ── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-light mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const inventoryStats = stats.inventory;
  const invoiceStats = stats.invoices;
  const lowStock = stats.low_stock_count;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-light text-sm">
            Welcome back, {user?.name || "User"}! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="date-range"
              label="Date Range"
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 text-text-light ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inventory Value"
          value={`GHS ${inventoryStats.total_value.toFixed(2)}`}
          icon={<Package className="w-6 h-6" />}
          trend={{ value: 12, direction: "up" }}
          subtitle={`${inventoryStats.total_items} items · ${inventoryStats.total_quantity} units`}
          color={COLORS.primary}
        />
        <StatCard
          title="Total Revenue"
          value={`GHS ${invoiceStats.total_amount.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: 8, direction: "up" }}
          subtitle={`${invoiceStats.total_invoices} invoices`}
          color={COLORS.success}
        />
        <StatCard
          title="Outstanding Balance"
          value={`GHS ${invoiceStats.total_remaining.toFixed(2)}`}
          icon={<AlertCircle className="w-6 h-6" />}
          trend={{ value: 5, direction: "down" }}
          subtitle={`${stats.invoice_status_breakdown.overdue.count} overdue`}
          color={COLORS.warning}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStock.total}
          icon={<TrendingDown className="w-6 h-6" />}
          trend={{ value: lowStock.total > 0 ? 15 : 0, direction: "down" }}
          subtitle={`${lowStock.out_of_stock} out of stock`}
          color={lowStock.total > 0 ? COLORS.danger : COLORS.success}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text">Weekly Sales</h3>
            <span className="text-xs text-text-light">Last 7 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weekly_sales}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                  }}
                  formatter={(value: any) => [`GHS ${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={COLORS.primary}
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory by Type */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text">
              Inventory by Type
            </h3>
            <span className="text-xs text-text-light">
              Total: {inventoryStats.total_items} items
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.inventory_by_type}
                  dataKey="quantity"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) =>
                    name ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                  }
                >
                  {stats.inventory_by_type.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                  }}
                  formatter={(value: any) => [`${value} units`, "Quantity"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice Status & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            Invoice Status
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.invoice_status_breakdown).map(
              ([status, data]) => {
                const colors: Record<string, string> = {
                  paid: "text-emerald-600",
                  invoiced: "text-blue-600",
                  partially_paid: "text-amber-600",
                  overdue: "text-red-600",
                  draft: "text-gray-600",
                  quoted: "text-purple-600",
                  cancelled: "text-red-600",
                };
                const total = invoiceStats.total_invoices || 1;
                const percentage = ((data.count / total) * 100).toFixed(0);

                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-light">
                        {getStatusLabel(status)}
                      </span>
                      <span
                        className={`font-medium ${colors[status] || "text-text"}`}
                      >
                        {data.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === "paid"
                            ? "bg-emerald-500"
                            : status === "invoiced"
                              ? "bg-blue-500"
                              : status === "partially_paid"
                                ? "bg-amber-500"
                                : status === "overdue"
                                  ? "bg-red-500"
                                  : status === "quoted"
                                    ? "bg-purple-500"
                                    : "bg-gray-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            Top Selling Items
          </h3>
          <div className="space-y-3">
            {stats.top_selling_items.length === 0 ? (
              <p className="text-sm text-text-light text-center py-4">
                No sales data available
              </p>
            ) : (
              stats.top_selling_items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-10 text-primary text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-light">
                        {item.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    GHS {item.revenue.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {stats.recent_transactions.length === 0 ? (
              <p className="text-sm text-text-light text-center py-4">
                No recent activity
              </p>
            ) : (
              stats.recent_transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      transaction.type === "invoice"
                        ? "bg-blue-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    {transaction.type === "invoice" ? (
                      <FileText
                        className={`w-4 h-4 ${transaction.status === "paid" ? "text-emerald-600" : "text-blue-600"}`}
                      />
                    ) : (
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          transaction.status === "paid" ||
                          transaction.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : transaction.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                      <span className="text-xs text-text-light">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                      {transaction.amount > 0 && (
                        <span className="text-xs font-medium text-emerald-600 ml-auto">
                          +GHS {transaction.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="mt-4 text-sm text-primary hover:underline w-full text-center"
          >
            View All Activity →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/invoices/create")}
            className="flex flex-col items-center gap-2 p-4 bg-background hover:bg-primary-5 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-text">New Invoice</span>
          </button>
          <button
            onClick={() => navigate("/inventory/add")}
            className="flex flex-col items-center gap-2 p-4 bg-background hover:bg-primary-5 rounded-lg transition-colors"
          >
            <Package className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-text">Add Inventory</span>
          </button>
          <button
            onClick={() => navigate("/customers")}
            className="flex flex-col items-center gap-2 p-4 bg-background hover:bg-primary-5 rounded-lg transition-colors"
          >
            <Users className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-text">
              Manage Customers
            </span>
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="flex flex-col items-center gap-2 p-4 bg-background hover:bg-primary-5 rounded-lg transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-text">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
