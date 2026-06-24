import React, { useState, useEffect, useCallback } from "react";
import DashboardService from "../../core/services/dashboard";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  FileText,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  XCircle,
  CheckCircle,
  Clock,
  Activity,
  Building2,
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
import { DashboardStats, Entity } from "../../core/types";
import { Input, Loader } from "../../components/common";
import UserService from "../../core/services/user";
import { usePageTitle } from "../../core/hooks/usePageTitle";

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
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#EF4444",
  slate: "#64748B",
  blue: "#3B82F6",
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

// ─── Empty State Component ──────────────────────────────────────────────────
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="p-3 bg-slate-50 rounded-full mb-3">{icon}</div>
    <p className="text-sm font-medium text-text">{title}</p>
    <p className="text-[11px] text-text-light mt-0.5">{description}</p>
  </div>
);

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
    <div className="bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-light">{title}</p>
          <p className="text-2xl font-bold text-text mt-1 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-light mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === "up" ? (
                <ArrowUp className="w-4 h-4 text-emerald-500" />
              ) : trend.direction === "down" ? (
                <ArrowDown className="w-4 h-4 text-rose-500" />
              ) : null}
              <span
                className={`text-xs font-medium ${
                  trend.direction === "up"
                    ? "text-emerald-500"
                    : trend.direction === "down"
                      ? "text-rose-500"
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
          className="p-3 rounded-xl flex-shrink-0 ml-3"
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
  const { user, entity, setEntity } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [loadingEntities, setLoadingEntities] = useState(false);

  usePageTitle("Insights");
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
      invoiced: { count: 0, amount: 0 },
      partially: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
    },
  });

  // ── Fetch Entities ────────────────────────────────────────────────────────
  const fetchEntities = useCallback(async () => {
  setLoadingEntities(true);
  try {
    const res = await UserService.getMyEntities();
    const entityList: Entity[] = res?.results || [];
    
    // Separate "ALL_ENTITIES" from the rest
    const allEntities = entityList.filter(e => e.uuid === "ALL_ENTITIES");
    const otherEntities = entityList.filter(e => e.uuid !== "ALL_ENTITIES");
    
    // Sort other entities alphabetically by name
    const sortedOthers = otherEntities.sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
    
    // Combine: "ALL_ENTITIES" first, then the rest sorted alphabetically
    const sortedEntities = [...allEntities, ...sortedOthers];

    setEntities(sortedEntities);

    // Set selected entity to current entity or first one
    if (entity && sortedEntities.some((e) => e.uuid === entity.uuid)) {
      setSelectedEntityId(entity.uuid);
    } else if (sortedEntities.length > 0) {
      setSelectedEntityId(sortedEntities[0].uuid);
    }
  } catch (err) {
    toast.error("Error", { description: "Failed to load entities" });
  } finally {
    setLoadingEntities(false);
  }
}, [entity]);;

  // ── Fetch Dashboard Data ──────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (loadingEntities) return;
    try {
      setLoading(true);

      const params: any = {};

      // Fix: Properly format dates for the API
      if (dateRange.start) {
        // Use UTC date to avoid timezone issues
        const startDate = new Date(dateRange.start);
        startDate.setUTCHours(0, 0, 0, 0);
        params.date_from = startDate.toISOString();
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setUTCHours(23, 59, 59, 999);
        params.date_to = endDate.toISOString();
      }

      // Add entity filter
      if (selectedEntityId) {
        params.entity_id = selectedEntityId;
      }

      console.log("📊 Fetching dashboard with params:", params); // Debug log

      const response = await DashboardService.getDashboardStats(
        params.date_from,
        params.date_to,
        params.entity_id,
      );

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
  }, [dateRange, selectedEntityId, loadingEntities]);

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // ── Fetch dashboard data when entity OR date range changes ────────────
  useEffect(() => {
    if (selectedEntityId) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, selectedEntityId, dateRange]); // ← Added dateRange

  // ── Listen for refresh events ──────────────────────────────────────────────
  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    console.log("📅 Date range changed:", {
      start: dateRange.start?.toISOString(),
      end: dateRange.end?.toISOString(),
    });
  }, [dateRange]);

  // ── Refresh Handler ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    toast.success("Success", { description: "Dashboard refreshed" });
  };

  // ── Entity Change Handler ────────────────────────────────────────────────
  const handleEntityChange = (value: string) => {
    setSelectedEntityId(value);
    const selectedEntity = entities.find((e) => e.uuid === value);
    if (selectedEntity && selectedEntity.uuid !== "ALL_ENTITIES") {
      setEntity(selectedEntity);
    }
  };

  // ── Entity Options ───────────────────────────────────────────────────────
  const entityOptions = [
    ...entities.map((e: Entity) => ({
      value: e.uuid,
      label: e.name,
    })),
  ];

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

  // ── Status Configuration ──────────────────────────────────────────────────
  const statusConfig: Record<
    string,
    {
      label: string;
      icon: any;
      color: string;
      bg: string;
      bar: string;
    }
  > = {
    paid: {
      label: "Paid",
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      bar: "bg-emerald-500",
    },
    invoiced: {
      label: "Invoiced",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      bar: "bg-blue-500",
    },
    partially: {
      label: "Partially Paid",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      bar: "bg-amber-500",
    },
    overdue: {
      label: "Overdue",
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      bar: "bg-rose-500",
    },
    draft: {
      label: "Draft",
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-slate-50",
      bar: "bg-slate-400",
    },

    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      bar: "bg-rose-400",
    },
  };

  if (loadingEntities) {
    return (
      <div className="flex justify-center items-center">
        <Loader />
      </div>
    );
  }
  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Business Insigts</h1>
          <p className="text-text-light text-sm">
            Welcome back, {user?.first_name || "User"}! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Entity Filter */}
          <div className="flex-1 sm:flex-initial min-w-[180px]">
            <Input
              type="select"
              label="Entity"
              value={selectedEntityId}
              onChange={handleEntityChange}
              selectOptions={entityOptions}
              selectPlaceholder={
                loadingEntities ? "Loading..." : "Select entity"
              }
              prefixIcon={<Building2 size={14} />}
            />
          </div>

          <div className="flex-1 sm:flex-initial min-w-[200px]">
            <Input
              label="Date Range"
              type="date-range"
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Refresh dashboard"
          >
            <RefreshCw
              className={`w-5 h-5 text-text-light ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inventory Value"
          value={`GHS ${inventoryStats.total_value.toFixed(2)}`}
          icon={<Package className="w-6 h-6" />}
          subtitle={`${inventoryStats.total_items} items · ${inventoryStats.total_quantity} units`}
          color={COLORS.primary}
        />
        <StatCard
          title="Total Revenue"
          value={`GHS ${invoiceStats.total_amount.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          subtitle={`${invoiceStats.total_invoices} invoices`}
          color={COLORS.success}
        />
        <StatCard
          title="Outstanding Balance"
          value={`GHS ${invoiceStats.total_remaining.toFixed(2)}`}
          icon={<AlertCircle className="w-6 h-6" />}
          subtitle={`${stats.invoice_status_breakdown.overdue.count} overdue`}
          color={COLORS.warning}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStock.total}
          icon={<TrendingDown className="w-6 h-6" />}
          subtitle={`${lowStock.out_of_stock} out of stock`}
          color={lowStock.total > 0 ? COLORS.danger : COLORS.success}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-card border border-border  p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text">Weekly Sales</h3>
              <p className="text-[11px] text-text-light">
                Last 7 days performance
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-primary-5 text-primary rounded-full">
              {stats.weekly_sales.length} days
            </span>
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
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [
                    `${entity?.currency ?? "GHC"} ${value.toFixed(2)}`,
                    "Revenue",
                  ]}
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
        <div className="bg-card border border-border  p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text">
                Inventory by Type
              </h3>
              <p className="text-[11px] text-text-light">
                Distribution across categories
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-primary-5 text-primary rounded-full">
              {inventoryStats.total_items} items
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
                    name && percent > 0.05
                      ? `${name} ${(percent * 100).toFixed(0)}%`
                      : ""
                  }
                  labelLine={false}
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
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value} units`, "Quantity"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice Status & Top Selling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Status Card */}
        {/* Invoice Status Card */}
        <div className="lg:col-span-1 bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-primary-5/15 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-10 rounded-xl">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    Invoice Status
                  </h3>
                  <p className="text-[11px] text-text-light">
                    Real-time breakdown
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-medium bg-primary-5 text-primary rounded-full whitespace-nowrap">
                {invoiceStats.total_invoices || 0} total
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3">
            {Object.keys(stats.invoice_status_breakdown).filter(
              (key) =>
                stats.invoice_status_breakdown[
                  key as keyof typeof stats.invoice_status_breakdown
                ].count > 0,
            ).length === 0 ? (
              <EmptyState
                icon={<FileText className="w-6 h-6 text-text-light/40" />}
                title="No invoice data"
                description="Create your first invoice to get started"
              />
            ) : (
              Object.entries(stats.invoice_status_breakdown)
                .filter(([_, data]) => data.count > 0) // Only show statuses with count > 0
                .sort(([statusA], [statusB]) => {
                  // Custom sort order: paid, invoiced, partially, overdue, draft, cancelled
                  const order = [
                    "paid",
                    "invoiced",
                    "partially",
                    "overdue",
                    "draft",
                    "cancelled",
                  ];
                  return order.indexOf(statusA) - order.indexOf(statusB);
                })
                .map(([status, data]) => {
                  const total = invoiceStats.total_invoices || 1;
                  const percentage = (data.count / total) * 100;
                  const config = statusConfig[status] || statusConfig.draft;
                  const Icon = config.icon;

                  return (
                    <div key={status} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`p-1 rounded-full ${config.bg} flex-shrink-0`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                          </div>
                          <span className="text-sm font-medium text-text truncate">
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold text-text text-sm">
                            {data.count}
                          </span>
                          <span
                            className={`text-xs font-medium ${config.color}`}
                          >
                            {percentage > 0
                              ? `${Math.round(percentage)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${config.bar}`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Top Selling Items Card */}
        <div className="lg:col-span-1 bg-card border border-border  overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-emerald-5/15 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-10 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    Top Selling
                  </h3>
                  <p className="text-[11px] text-text-light">
                    Best performing items
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-2.5">
            {stats.top_selling_items.length === 0 ? (
              <EmptyState
                icon={<Package className="w-6 h-6 text-text-light/40" />}
                title="No sales data"
                description="Start selling to see your top items"
              />
            ) : (
              stats.top_selling_items.slice(0, 5).map((item, index) => {
                const maxRevenue = stats.top_selling_items[0]?.revenue || 1;
                const progress = (item.revenue / maxRevenue) * 100;

                const rankStyles = [
                  "bg-amber-100 text-amber-700",
                  "bg-slate-200 text-slate-700",
                  "bg-amber-50/80 text-amber-600",
                  "bg-blue-50 text-blue-600",
                  "bg-slate-50 text-slate-500",
                ];
                const barColors = [
                  "bg-amber-500",
                  "bg-slate-400",
                  "bg-amber-400",
                  "bg-blue-500",
                  "bg-slate-300",
                ];

                return (
                  <div key={item.id || index} className="group">
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          rankStyles[index] || rankStyles[4]
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-text truncate">
                            {item.name}
                          </span>
                          <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                            {entity?.currency} {item.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-text-light">
                            {item.quantity} units
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                barColors[index] || barColors[4]
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="lg:col-span-1 bg-card border border-border  overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-indigo-5/15 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-10 rounded-xl">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">
                    Recent Activity
                  </h3>
                  <p className="text-[11px] text-text-light">
                    Latest transactions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3">
            {stats.recent_transactions.length === 0 ? (
              <EmptyState
                icon={<Activity className="w-6 h-6 text-text-light/40" />}
                title="No recent activity"
                description="Transactions will appear here"
              />
            ) : (
              stats.recent_transactions.slice(0, 4).map((transaction, idx) => (
                <div
                  key={transaction.id || idx}
                  className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <div
                    className={`p-2 rounded-xl ${
                      transaction.type === "invoice"
                        ? "bg-blue-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    {transaction.type === "invoice" ? (
                      <FileText
                        className={`w-4 h-4 ${
                          transaction.status === "paid"
                            ? "text-emerald-600"
                            : "text-blue-600"
                        }`}
                      />
                    ) : (
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          transaction.status === "paid" ||
                          transaction.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : transaction.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                      <span className="text-[10px] text-text-light">
                        {new Date(transaction.date).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                      {transaction.amount > 0 && (
                        <span className="text-[10px] font-medium text-emerald-600 ml-auto">
                          +{entity?.currency || "GHC"}{" "}
                          {transaction.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
