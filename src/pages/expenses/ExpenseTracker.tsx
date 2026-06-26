import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  DollarSign,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button, DataTable } from "../../components/common";
import { ColumnDef } from "../../components/common/Datatable";
import { useStore } from "../../core/contexts/StoreProvider";
import { useModal } from "../../core/hooks/useModal";
import ExpenseModal from "./ExpenseModal";
import expenseService from "../../core/services/expenses";
import { eventService } from "../../core/services/events";
import { Expense, ExpenseCategory } from "../../core/types";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import ConfirmModal from "../../components/common/ConfirmModal";

const CHART_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#F97316", "#3B82F6"];

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  paid: { label: "Paid", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const PAYMENT_METHOD_CONFIG = {
  cash: { label: "Cash", icon: "💰" },
  bank: { label: "Bank Transfer", icon: "🏦" },
  mobile_money: { label: "Mobile Money", icon: "📱" },
  credit_card: { label: "Credit Card", icon: "💳" },
};

const DEFAULT_CATEGORIES = [
  'Office Supplies', 'Utilities', 'Rent', 'Salaries', 'Marketing',
  'Transport', 'Equipment', 'Food & Drinks', 'Software', 'Maintenance',
  'Insurance', 'Travel', 'Training', 'Other'
];

// ─── Statistics Types ──────────────────────────────────────────────────────
interface ExpenseStats {
  total_expenses: number;
  count: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  amount: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

const ExpenseTracker: React.FC = () => {
  const { entity } = useStore();
  const { openModal } = useModal();
  usePageTitle("Expense Tracker");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // ── Server-side Statistics State ──────────────────────────────────────────
  const [stats, setStats] = useState<ExpenseStats>({
    total_expenses: 0,
    count: 0,
    avg_amount: 0,
    max_amount: 0,
    min_amount: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  
  const LIMIT = 3;

  const buildCategoryList = (names: string[]) =>
    names.map((name, index) => ({
      id: `cat-${index}`,
      name,
      icon: expenseService.getCategoryIcon(name),
      color: CHART_COLORS[index % CHART_COLORS.length],
      budget: 0,
      spent: 0,
    }));

  // ── Helper functions ──────────────────────────────────────────────────────
  const formatCurrency = useCallback((amount: number) => {
    const currency = entity?.currency || "GHC";
    return `${currency} ${amount.toFixed(2)}`;
  }, [entity?.currency]);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderPaymentMethod = (method: string) => {
    const config = PAYMENT_METHOD_CONFIG[method as keyof typeof PAYMENT_METHOD_CONFIG] || PAYMENT_METHOD_CONFIG.cash;
    return (
      <span className="text-xs text-text-light flex items-center gap-1">
        {config.label}
      </span>
    );
  };

  const renderCategoryBadge = useCallback((categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    if (!category) return <span className="text-xs text-text-light">{categoryName}</span>;
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
        {category.name}
      </span>
    );
  }, [categories]);

  // ── Fetch Categories ──────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const response = await expenseService.getOptions();
      if (response.success && response.results?.categories?.length) {
        setCategories(buildCategoryList(response.results.categories));
      } else {
        setCategories(buildCategoryList(DEFAULT_CATEGORIES));
      }
    } catch (error) {
      console.error('Error fetching categories, using defaults:', error);
      setCategories(buildCategoryList(DEFAULT_CATEGORIES));
    }
  }, []);

  // ── Fetch Statistics from Server ─────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      
      // Build query params for stats
      const params: Record<string, any> = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      // Fetch all stats in parallel
      const [statsResponse, categoryResponse, statusResponse] = await Promise.all([
        expenseService.getStats(params),
        expenseService.getCategoryBreakdown(params),
        expenseService.getStatusBreakdown(params),
      ]);

      // Set stats
      if (statsResponse.success) {
        setStats(statsResponse.results || {
          total_expenses: 0,
          count: 0,
          avg_amount: 0,
          max_amount: 0,
          min_amount: 0,
        });
      }

      // Set category breakdown
      if (categoryResponse.success) {
        setCategoryBreakdown(categoryResponse.results || []);
      }

      // Set status breakdown
      if (statusResponse.success) {
        setStatusBreakdown(statusResponse.results || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [filterCategory, filterStatus, searchQuery]);

  // ── Fetch Expenses ────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async (
    currentPage = page,
    currentSearch = searchQuery,
    currentCategory = filterCategory,
    currentStatus = filterStatus,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: currentPage,
        limit: LIMIT,
      };

      if (currentSearch) params.search = currentSearch;
      if (currentCategory) params.category = currentCategory;
      if (currentStatus) params.status = currentStatus;

      const response = await expenseService.getExpenses(params);
      if (response.success) {
        setExpenses(response.results || []);
        setCount(response.count || 0);
      } else {
        setError(response.message || 'Failed to load expenses');
        toast.error('Error', { description: response.message || 'Failed to load expenses' });
      }
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Failed to load expenses');
      toast.error('Error', { description: err.message || 'Failed to load expenses' });
    } finally {
      setLoading(false);
    }
    //eslint-disable-next-line
  }, [page, searchQuery, filterCategory, filterStatus]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchExpenses(page, searchQuery, filterCategory, filterStatus);
    //eslint-disable-next-line
  }, [page, searchQuery, filterCategory, filterStatus, refreshKey]);

  useEffect(() => {
    fetchStats();
    //eslint-disable-next-line
  }, [filterCategory, filterStatus, searchQuery, refreshKey]);

  useEffect(() => {
    fetchCategories();
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      fetchCategories();
    };
    eventService.onRefresh(handleRefresh);
    return () => eventService.offRefresh(handleRefresh);
  }, [fetchCategories]);

  // ── Statistics from Server ────────────────────────────────────────────────
  const statistics = useMemo(() => {
    // Calculate pending and paid amounts from status breakdown
    const pendingStatus = statusBreakdown.find(s => s.status === 'pending');
    const paidStatus = statusBreakdown.find(s => s.status === 'paid');
    
    const totalPending = pendingStatus?.amount || 0;
    const totalPaid = paidStatus?.amount || 0;
    const pendingCount = pendingStatus?.count || 0;
    const paidCount = paidStatus?.count || 0;

    // Build category breakdown for pie chart
    const categoryChartData = categories.map((cat) => {
      const found = categoryBreakdown.find(c => c.category === cat.name);
      return {
        name: cat.name,
        spent: found?.amount || 0,
        budget: cat.budget || 0,
        count: found?.count || 0,
      };
    });

    // Build monthly trend from expenses data (still need expenses for this)
    const monthlyTrend: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = exp.date.substring(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + exp.amount;
    });

    const trendData = Object.entries(monthlyTrend)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalExpenses: stats.total_expenses || 0,
      totalPaid,
      totalPending,
      categoryBreakdown: categoryChartData,
      trendData,
      count: stats.count || 0,
      paidCount,
      pendingCount,
      avgAmount: stats.avg_amount || 0,
      maxAmount: stats.max_amount || 0,
      minAmount: stats.min_amount || 0,
    };
  }, [stats, categoryBreakdown, statusBreakdown, categories, expenses]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // setPage(1);
  };

  const handleFilter = (filter: string) => {
    const categoryValues = categories.map(c => c.name);
    if (categoryValues.includes(filter) || filter === "") {
      setFilterCategory(filter);
      setFilterStatus("");
    } else {
      setFilterStatus(filter);
      setFilterCategory("");
    }
    setPage(1);
  };

  const handleSort = (sortValue: string) => {
    if (!sortValue) return;
    const [field, direction] = sortValue.split('_');
    const dir = direction as 'asc' | 'desc';

    setExpenses((prev) =>
      [...prev].sort((a, b) => {
        let cmp = 0;
        switch (field) {
          case "title": cmp = a.title.localeCompare(b.title); break;
          case "amount": cmp = a.amount - b.amount; break;
          case "date": cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
          case "category": cmp = a.category.localeCompare(b.category); break;
          case "status": cmp = a.status.localeCompare(b.status); break;
          default: cmp = 0;
        }
        return dir === 'asc' ? cmp : -cmp;
      })
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    try {
      const result = await openModal(ExpenseModal, {
        data: { mode: "create", categories },
        side: "right",
        size: "lg",
      });

      if (result?.success && result?.data) {
        const response = await expenseService.create({
          ...result.data,
          entity_id: entity?.uuid,
        });

        if (response.success) {
          toast.success("Success", { description: "Expense created successfully" });
          setRefreshKey(prev => prev + 1);
        } else {
          toast.error("Error", { description: response.message || "Failed to create expense" });
        }
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Failed to add expense" });
    }
  };

  const handleEditExpense = async (expense: Expense) => {
    try {
      const result = await openModal(ExpenseModal, {
        data: { mode: "edit", expense, categories },
        side: "right",
        size: "lg",
      });

      if (result?.success && result?.data) {
        const response = await expenseService.update(expense.uuid, result.data);
        if (response.success) {
          toast.success("Success", { description: "Expense updated successfully" });
          setRefreshKey(prev => prev + 1);
        } else {
          toast.error("Error", { description: response.message || "Failed to update expense" });
        }
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Failed to update expense" });
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      const result = await openModal(ConfirmModal, { data: { 
        title: "Delete Expense", 
        message: "Are you sure you want to delete this expense? This action cannot be undone."
      } });

      if (result?.confirmed) {
        const response = await expenseService.delete(expense.uuid);
        if (response.success) {
          toast.success("Success", { description: "Expense deleted successfully" });
          setRefreshKey(prev => prev + 1);
        } else {
          toast.error("Error", { description: response.message || "Failed to delete expense" });
        }
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Failed to delete expense" });
    }
  };

  const handleMarkExpenseAsPaid = async (expense: Expense) => {
    try {
      const response = await expenseService.markAsPaid(expense.uuid);
      if (response.success) {
        toast.success("Success", { description: "Expense paid successfully" });
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error("Error", { description: response.message || "Failed to approve expense" });
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Failed to approve expense" });
    }
  };

  const handleRefresh = async () => {
    await fetchCategories();
    setRefreshKey(prev => prev + 1);
    toast.success("Success", { description: "Expenses refreshed" });
  };

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      header: "TITLE",
      sortable: true,
      sortField: "title",
      value: (item: Expense) => (
        <div key={item.uuid}>
          <p className="text-sm font-medium text-text">{item.title}</p>
          {item.description && (
            <p className="text-xs text-text-light truncate max-w-[150px]">{item.description}</p>
          )}
        </div>
      ),
      type: "column",
      bold: true,
    },
    {
      header: "CATEGORY",
      sortable: true,
      sortField: "category",
      value: (item: Expense) => renderCategoryBadge(item.category),
      type: "column",
    },
    {
      header: "AMOUNT",
      sortable: true,
      sortField: "amount",
      value: (item: Expense) => (
        <span className="text-sm font-semibold text-text">{formatCurrency(item.amount)}</span>
      ),
      type: "column",
      bold: true,
    },
    {
      header: "DATE",
      sortable: true,
      sortField: "date",
      value: (item: Expense) => (
        <span className="text-sm text-text-light">{formatDate(item.date)}</span>
      ),
      type: "column",
    },
    {
      header: "PAYMENT",
      value: (item: Expense) => renderPaymentMethod(item.payment_method),
      type: "column",
    },
    {
      header: "STATUS",
      sortable: true,
      sortField: "status",
      value: (item: Expense) => renderStatusBadge(item.status),
      type: "column",
    },
  ];

  const getCustomActions = (item: Expense) => {
    if (item.status !== 'pending') return [];
    return [
      {
        title: "Mark as paid",
        icon: "check",
        handler: () => handleMarkExpenseAsPaid(item),
        classes: "text-success",
      },
      {
        title: "Edit",
        icon: "edit",
        handler: () => handleEditExpense(item),
      },
      {
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteExpense(item),
        classes: "text-danger",
      },
    ];
  };

  const filterOptions = [
    { value: "", label: "All Categories" },
    ...categories.map(cat => ({ value: cat.name, label: cat.name })),
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
  ];

  const sortOptions = [
    { value: "title_asc", label: "Title A-Z" },
    { value: "title_desc", label: "Title Z-A" },
    { value: "amount_asc", label: "Amount Low-High" },
    { value: "amount_desc", label: "Amount High-Low" },
    { value: "date_asc", label: "Oldest First" },
    { value: "date_desc", label: "Newest First" },
    { value: "category_asc", label: "Category A-Z" },
    { value: "category_desc", label: "Category Z-A" },
    { value: "status_asc", label: "Status A-Z" },
    { value: "status_desc", label: "Status Z-A" },
  ];

  // ── Loading / Error States ────────────────────────────────────────────────
  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-light mt-4">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text">Failed to Load Expenses</h2>
          <p className="text-text-light mt-2">{error}</p>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Expense Tracker</h2>
          <p className="text-text-light text-sm">Manage and monitor all business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddExpense}>
            <Plus className="w-5 h-5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-light uppercase tracking-wider">Total Expenses</p>
              <p className="text-xl font-bold text-text mt-1">{formatCurrency(statistics.totalExpenses)}</p>
              <p className="text-[10px] text-text-light mt-0.5">{statistics.count} transactions</p>
              {statistics.avgAmount > 0 && (
                <p className="text-[10px] text-text-light">Avg: {formatCurrency(statistics.avgAmount)}</p>
              )}
            </div>
            <div className="p-2 bg-primary-10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-light uppercase tracking-wider">Paid</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(statistics.totalPaid)}</p>
              <p className="text-[10px] text-text-light mt-0.5">{statistics.paidCount} paid</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-light uppercase tracking-wider">Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(statistics.totalPending)}</p>
              <p className="text-[10px] text-text-light mt-0.5">{statistics.pendingCount} pending</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Loading Indicator */}
      {statsLoading && (
        <div className="text-center text-text-light text-sm mb-4">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Updating statistics...
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-4">Monthly Trend</h3>
          <div className="h-64">
            {statistics.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statistics.trendData}>
                  <defs>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: any) => [formatCurrency(value), "Expenses"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4F46E5" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-light">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-4">Category Breakdown</h3>
          <div className="h-64">
            {statistics.categoryBreakdown.filter((c) => c.spent > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.categoryBreakdown.filter((c) => c.spent > 0)}
                    dataKey="spent"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) =>
                      name && percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                    }
                    labelLine={false}
                  >
                    {statistics.categoryBreakdown
                      .filter((c) => c.spent > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: any) => [formatCurrency(value), "Spent"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-light">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        placeholder="Search by title, description, or category..."
        searchLabel="Search Expenses"
        noDataMessage={
          searchQuery || filterCategory || filterStatus
            ? "No expenses match your filters"
            : "No expenses found. Add your first expense!"
        }
        addButtonText="Add Expense"
        page={page}
        limit={LIMIT}
        count={count}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
        customActions={getCustomActions}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onAdd={handleAddExpense}
      />
    </div>
  );
};

export default ExpenseTracker;