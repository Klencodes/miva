import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  DollarSign,
  Receipt,
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
import Input, { SelectOption } from "../../components/common/Input";
import { Button } from "../../components/common";
import { useStore } from "../../core/contexts/StoreProvider";
import { useModal } from "../../core/hooks/useModal";
import ExpenseModal from "./ExpenseModal";
import DeleteExpenseModal from "./DeleteExpenseModal";
import expenseService, { Expense } from "../../core/services/expenses";
import { eventService } from "../../core/services/events";
import { ExpenseCategory } from "../../core/types";


// ─── Color Palette ──────────────────────────────────────────────────────────

const CHART_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#F97316", "#3B82F6"];

// ─── Status Configuration ────────────────────────────────────────────────────

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


const STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
];

// ─── Main Component ─────────────────────────────────────────────────────────

const ExpenseTracker: React.FC = () => {
  const { entity } = useStore();
  const { openModal } = useModal();

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [error, setError] = useState<string | null>(null);


  // ── Fetch Expenses ────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {};
      
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedStatus) filters.status = selectedStatus;
      if (dateRange.start) {
        filters.start_date = dateRange.start.toISOString().split('T')[0];
      }
      if (dateRange.end) {
        filters.end_date = dateRange.end.toISOString().split('T')[0];
      }

      const response = await expenseService.getExpenses(filters);

      if (response.success) {
        setExpenses(response?.results?.expenses || []);
      } else {
        setError(response.message || 'Failed to load expenses');
        toast.error('Error', { description: response.message || 'Failed to load expenses' });
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      setError(error.message || 'Failed to load expenses');
      toast.error('Error', { description: error.message || 'Failed to load expenses' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus, dateRange]);

  // ── Fetch Categories ─────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
  try {
    const response = await expenseService.getExpenseOptions();

    if (response.success && response.results) {
      const categoryList = response.results.categories.map((name: string, index: number) => ({
        id: `cat-${index}`,
        name,
        icon: expenseService.getCategoryIcon(name),
        color: CHART_COLORS[index % CHART_COLORS.length],
        budget: 0,
        spent: 0,
      }));

      setCategories(categoryList);
    } else {
      // Fallback to default categories
      const defaultCategories = [
        'Office Supplies', 'Utilities', 'Rent', 'Salaries', 'Marketing',
        'Transport', 'Equipment', 'Food & Drinks', 'Software', 'Maintenance',
        'Insurance', 'Travel', 'Training', 'Other'
      ];
      const categoryList = defaultCategories.map((name, index) => ({
        id: `cat-${index}`,
        name,
        icon: expenseService.getCategoryIcon(name),
        color: CHART_COLORS[index % CHART_COLORS.length],
        budget: 0,
        spent: 0,
      }));
      setCategories(categoryList);
    }
  } catch (error) {
    console.error('Error fetching categories, using defaults:', error);
    // Use default categories on error
    const defaultCategories = [
      'Office Supplies', 'Utilities', 'Rent', 'Salaries', 'Marketing',
      'Transport', 'Equipment', 'Food & Drinks', 'Software', 'Maintenance',
      'Insurance', 'Travel', 'Training', 'Other'
    ];
    const categoryList = defaultCategories.map((name, index) => ({
      id: `cat-${index}`,
      name,
      icon: expenseService.getCategoryIcon(name),
      color: CHART_COLORS[index % CHART_COLORS.length],
      budget: 0,
      spent: 0,
    }));
    setCategories(categoryList);
  }
  

}, []);


  // ── Initial Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, [fetchCategories, fetchExpenses]);

   useEffect(() => {
      const handleRefresh = () => {
        fetchExpenses();
        fetchCategories();
      };
  
      eventService.onRefresh(handleRefresh);
  
      return () => {
        eventService.offRefresh(handleRefresh);
      };
    }, [fetchExpenses, fetchCategories]);


  // ── Filtered Expenses ─────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses;
  }, [expenses]);

  // ── Statistics ────────────────────────────────────────────────────────────
  const statistics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPaid = expenses.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
    const totalPending = expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
    

    const categoryBreakdown = categories.map((cat) => ({
      name: cat.name,
      spent: expenses.filter((e) => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
      budget: cat.budget || 0,
      count: expenses.filter((e) => e.category === cat.name).length,
    }));

    const monthlyTrend: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = exp.date.substring(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + exp.amount;
    });

    const trendData = Object.entries(monthlyTrend)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalExpenses,
      totalPaid,
      totalPending,
      categoryBreakdown,
      trendData,
      count: expenses.length,
      paidCount: expenses.filter((e) => e.status === "paid").length,
    };
  }, [expenses, categories]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddExpense = useCallback(async () => {
    try {
      const result = await openModal(ExpenseModal, {
        data: { mode: "create", categories },
        side: "right",
        size: "lg",
      });

      if (result?.success && result?.data) {
        // Create expense via API
        const response = await expenseService.createExpense({
          ...result.data,
          entity_id: entity?.uuid,
        });

        if (response.success) {
          toast.success("Success", { description: "Expense created successfully" });
          fetchExpenses();
        } else {
          toast.error("Error", { description: response.message || "Failed to create expense" });
        }
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast.error("Error", { description: error.message || "Failed to add expense" });
    }
  }, [openModal, categories, entity, fetchExpenses]);

  const handleEditExpense = useCallback(async (expense: Expense) => {
    try {
      const result = await openModal(ExpenseModal, {
        data: { mode: "edit", expense, categories },
        side: "right",
        size: "lg",
      });

      if (result?.success && result?.data) {
        const response = await expenseService.updateExpense(expense.uuid, result.data);
        
        if (response.success) {
          toast.success("Success", { description: "Expense updated successfully" });
          fetchExpenses();
        } else {
          toast.error("Error", { description: response.message || "Failed to update expense" });
        }
      }
    } catch (error: any) {
      console.error("Error editing expense:", error);
      toast.error("Error", { description: error.message || "Failed to update expense" });
    }
  }, [openModal, categories, fetchExpenses]);


  const handleDeleteExpense = useCallback(async (expense: Expense) => {
    try {
      const result = await openModal(DeleteExpenseModal, {
        data: { expense },
      });

      if (result?.success) {
        const response = await expenseService.deleteExpense(expense.uuid);
        
        if (response.success) {
          toast.success("Success", { description: "Expense deleted successfully" });
          fetchExpenses();
        } else {
          toast.error("Error", { description: response.message || "Failed to delete expense" });
        }
      }
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error("Error", { description: error.message || "Failed to delete expense" });
    }
  }, [openModal, fetchExpenses]);

  const handleApproveExpense = useCallback(async (expense: Expense) => {
    try {
      const response = await expenseService.approveExpense(expense.uuid);
      
      if (response.success) {
        toast.success("Success", { description: "Expense approved successfully" });
        fetchExpenses();
      } else {
        toast.error("Error", { description: response.message || "Failed to approve expense" });
      }
    } catch (error: any) {
      console.error("Error approving expense:", error);
      toast.error("Error", { description: error.message || "Failed to approve expense" });
    }
  }, [fetchExpenses]);


  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExpenses();
    toast.success("Success", { description: "Expenses refreshed" });
  }, [fetchExpenses]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStatus("");
    setDateRange({ start: null, end: null });
  }, []);

  // ── Format Helpers ────────────────────────────────────────────────────────
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

  // ── Render Status Badge ──────────────────────────────────────────────────
  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // ── Render Payment Method ────────────────────────────────────────────────
  const renderPaymentMethod = (method: string) => {
    const config = PAYMENT_METHOD_CONFIG[method as keyof typeof PAYMENT_METHOD_CONFIG] || PAYMENT_METHOD_CONFIG.cash;
    return (
      <span className="text-xs text-text-light flex items-center gap-1">
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // ── Render Category Badge ────────────────────────────────────────────────
  const renderCategoryBadge = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    if (!category) return <span className="text-xs text-text-light">{categoryName}</span>;
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
        {category.icon} {category.name}
      </span>
    );
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-light mt-4">Loading expenses...</p>
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text">Failed to Load Expenses</h2>
          <p className="text-text-light mt-2">{error}</p>
          <button
            onClick={fetchExpenses}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Expense Tracker</h1>
          <p className="text-text-light text-sm">Manage and monitor all business expenses</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-text-light ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={handleAddExpense} className="w-full md:w-auto">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-light uppercase tracking-wider">Total Expenses</p>
              <p className="text-xl font-bold text-text mt-1">{formatCurrency(statistics.totalExpenses)}</p>
              <p className="text-[10px] text-text-light mt-0.5">{statistics.count} transactions</p>
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
              <p className="text-[10px] text-text-light mt-0.5">{expenses.filter(e => e.status === 'pending').length} pending</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

       
      </div>

      {/* Filters */}
      <div className="bg-card border border-border p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 min-w-[150px]">
            <Input
              type="search"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={setSearchQuery}
              prefixIcon={<Search size={15} />}
            />
          </div>
          {/* <div className="flex-1 min-w-[150px]">
            <Input
              type="select"
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              selectOptions={[
                { value: "", label: "All Categories" },
                ...categoryOptions,
              ]}
              prefixIcon={<Tag size={14} />}
            />
          </div> */}
          <div className="flex-1 min-w-[150px]">
            <Input
              type="select"
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              selectOptions={[
                { value: "", label: "All Statuses" },
                ...STATUS_OPTIONS,
              ]}
              prefixIcon={<Filter size={14} />}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Date Range"
              type="date-range"
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-4">Monthly Trend</h3>
          <div className="h-64">
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
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [formatCurrency(value), "Expenses"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#4F46E5"
                  fill="url(#expenseGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-4">Category Breakdown</h3>
          <div className="h-64">
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
                    name && percent > 0.05
                      ? `${name} ${(percent * 100).toFixed(0)}%`
                      : ""
                  }
                  labelLine={false}
                >
                  {statistics.categoryBreakdown
                    .filter((c) => c.spent > 0)
                    .map((entry, index) => (
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
                  formatter={(value: any) => [formatCurrency(value), "Spent"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-light">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 opacity-30" />
                      <p>No expenses found</p>
                      <p className="text-xs">Try adjusting your filters or add a new expense</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">{expense.title}</p>
                        {expense.description && (
                          <p className="text-xs text-text-light truncate max-w-[150px]">{expense.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{renderCategoryBadge(expense.category)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-text">{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-light">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-4 py-3">{renderPaymentMethod(expense.payment_method)}</td>
                    <td className="px-4 py-3">{renderStatusBadge(expense.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {expense.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveExpense(expense)}
                              className="p-1.5 hover:bg-background rounded-lg transition-colors text-text-light hover:text-emerald-600"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        
                        {(expense.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="p-1.5 hover:bg-background rounded-lg transition-colors text-text-light hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense)}
                              className="p-1.5 hover:bg-background rounded-lg transition-colors text-text-light hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-background flex justify-between items-center flex-wrap gap-2">
          <span className="text-sm text-text-light">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;