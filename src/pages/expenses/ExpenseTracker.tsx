import React, { useState, useRef, useEffect } from "react";
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
import { Button, DataTable } from "../../components/common";
import { ColumnDef } from "../../components/common/Datatable";
import Input from "../../components/common/Input";
import { useStore } from "../../core/contexts/StoreProvider";
import { useModal } from "../../core/hooks/useModal";
import ExpenseModal from "./ExpenseModal";
import DeleteExpenseModal from "./DeleteExpenseModal";
import expenseService from "../../core/services/expenses";
import { eventService } from "../../core/services/events";
import { Expense, ExpenseCategory } from "../../core/types";
import { usePageTitle } from "../../core/hooks/usePageTitle";

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

// ─── Main Component ─────────────────────────────────────────────────────────
const ExpenseTracker: React.FC = () => {
  const { entity } = useStore();
  const { openModal } = useModal();
  usePageTitle("Expense Tracker");

  // ── State ──────────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 10;

  // ── Refs to always have latest values without re-creating fetch ────────────
  const searchRef = useRef(searchQuery);
  const filterCategoryRef = useRef(filterCategory);
  const filterStatusRef = useRef(filterStatus);
  const pageRef = useRef(page);
  const dateRangeRef = useRef(dateRange);

  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { filterCategoryRef.current = filterCategory; }, [filterCategory]);
  useEffect(() => { filterStatusRef.current = filterStatus; }, [filterStatus]);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { dateRangeRef.current = dateRange; }, [dateRange]);

  // ── Helper functions ──────────────────────────────────────────────────────
  const formatCurrency = (amount: number) => {
    const currency = entity?.currency || "GHC";
    return `${currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    return config.bg + " " + config.color;
  };

  const getStatusLabel = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    return config.label;
  };

  const getPaymentMethodLabel = (method: string) => {
    const config = PAYMENT_METHOD_CONFIG[method as keyof typeof PAYMENT_METHOD_CONFIG] || PAYMENT_METHOD_CONFIG.cash;
    return config.label;
  };

  const getPaymentMethodIcon = (method: string) => {
    const config = PAYMENT_METHOD_CONFIG[method as keyof typeof PAYMENT_METHOD_CONFIG] || PAYMENT_METHOD_CONFIG.cash;
    return config.icon;
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || CHART_COLORS[0];
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.icon || "📦";
  };

  // ── Fetch Categories ─────────────────────────────────────────────────────
  const fetchCategories = useRef(async () => {
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
  }).current;

  // ── Fetch Expenses (stable, never recreated) ───────────────────────────────
  const fetchExpenses = useRef(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: pageRef.current,
        limit: LIMIT,
      };

      if (searchRef.current) {
        params.search = searchRef.current;
      }

      if (filterCategoryRef.current) {
        params.category = filterCategoryRef.current;
      }

      if (filterStatusRef.current) {
        params.status = filterStatusRef.current;
      }

      if (dateRangeRef.current.start) {
        params.start_date = dateRangeRef.current.start.toISOString().split('T')[0];
      }

      if (dateRangeRef.current.end) {
        params.end_date = dateRangeRef.current.end.toISOString().split('T')[0];
      }

      const response = await expenseService.getExpenses(params);

      if (response.success) {
        setExpenses(response?.results || []);
        setCount(response?.count || 0);
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
    }
  }).current;

  // ── Trigger fetch when dependencies change ──────────────────────────────
  useEffect(() => {
    fetchExpenses();
  }, [page, searchQuery, filterCategory, filterStatus, dateRange, refreshKey]);

  // ── Initial Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, []);

  // ── Listen for refresh events ──────────────────────────────────────────────
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
      fetchCategories();
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    searchRef.current = query;
    pageRef.current = 1;
    setSearchQuery(query);
    setPage(1);
  };

  const handleFilter = (filter: string) => {
    // Determine if filter is for category or status
    const categoryNames = categories.map(c => c.name);
    const statusValues = ['pending', 'paid'];

    if (filter === 'all' || filter === '') {
      filterCategoryRef.current = '';
      filterStatusRef.current = '';
      setFilterCategory('');
      setFilterStatus('');
    } else if (categoryNames.includes(filter)) {
      filterCategoryRef.current = filter;
      filterStatusRef.current = '';
      setFilterCategory(filter);
      setFilterStatus('');
    } else if (statusValues.includes(filter)) {
      filterStatusRef.current = filter;
      filterCategoryRef.current = '';
      setFilterStatus(filter);
      setFilterCategory('');
    }

    pageRef.current = 1;
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
          case 'title':
            cmp = (a.title || '').localeCompare(b.title || '');
            break;
          case 'amount':
            cmp = a.amount - b.amount;
            break;
          case 'date':
            cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'category':
            cmp = (a.category || '').localeCompare(b.category || '');
            break;
          case 'status':
            cmp = (a.status || '').localeCompare(b.status || '');
            break;
          default:
            cmp = 0;
        }

        return dir === 'asc' ? cmp : -cmp;
      })
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    setDateRange({ start: start || null, end: end || null });
    setPage(1);
  };

  const clearFilters = () => {
    searchRef.current = '';
    filterCategoryRef.current = '';
    filterStatusRef.current = '';
    pageRef.current = 1;
    setSearchQuery('');
    setFilterCategory('');
    setFilterStatus('');
    setDateRange({ start: null, end: null });
    setPage(1);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    try {
      const result = await openModal(ExpenseModal, {
        data: { mode: "create", categories },
        side: "right",
        size: "lg",
      });

      if (result?.success && result?.data) {
        const response = await expenseService.createExpense({
          ...result.data,
          entity_id: entity?.uuid,
        });

        if (response.success) {
          toast.success("Success", { description: "Expense created successfully" });
          fetchExpenses();
          fetchCategories();
        } else {
          toast.error("Error", { description: response.message || "Failed to create expense" });
        }
      }
    } catch (error: any) {
      console.error("Error adding expense:", error);
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
        const response = await expenseService.updateExpense(expense.uuid, result.data);

        if (response.success) {
          toast.success("Success", { description: "Expense updated successfully" });
          fetchExpenses();
          fetchCategories();
        } else {
          toast.error("Error", { description: response.message || "Failed to update expense" });
        }
      }
    } catch (error: any) {
      console.error("Error editing expense:", error);
      toast.error("Error", { description: error.message || "Failed to update expense" });
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      const result = await openModal(DeleteExpenseModal, {
        data: { expense },
      });

      if (result?.success) {
        const response = await expenseService.deleteExpense(expense.uuid);

        if (response.success) {
          toast.success("Success", { description: "Expense deleted successfully" });
          fetchExpenses();
          fetchCategories();
        } else {
          toast.error("Error", { description: response.message || "Failed to delete expense" });
        }
      }
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error("Error", { description: error.message || "Failed to delete expense" });
    }
  };

  const handleApproveExpense = async (expense: Expense) => {
    try {
      const response = await expenseService.approveExpense(expense.uuid);

      if (response.success) {
        toast.success("Success", { description: "Expense approved successfully" });
        fetchExpenses();
        fetchCategories();
      } else {
        toast.error("Error", { description: response.message || "Failed to approve expense" });
      }
    } catch (error: any) {
      console.error("Error approving expense:", error);
      toast.error("Error", { description: error.message || "Failed to approve expense" });
    }
  };

  // ── Statistics ────────────────────────────────────────────────────────────
  const statistics = {
    totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    totalPaid: expenses.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amount, 0),
    totalPending: expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0),
    count: expenses.length,
    paidCount: expenses.filter((e) => e.status === "paid").length,
    pendingCount: expenses.filter((e) => e.status === "pending").length,
  };

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const trendData = (() => {
    const monthlyTrend: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = exp.date.substring(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + exp.amount;
    });
    return Object.entries(monthlyTrend)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  })();

  const categoryBreakdown = categories.map((cat) => ({
    name: cat.name,
    spent: expenses.filter((e) => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
    budget: cat.budget || 0,
    count: expenses.filter((e) => e.category === cat.name).length,
  }));

  // ── Column definitions ─────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      header: "TITLE",
      sortable: true,
      sortField: "title",
      value: (item: Expense) => {
        return [
          <div key={item.uuid}>
            <p className="text-sm font-medium text-text">{item.title}</p>
            {item.description && (
              <p className="text-xs text-text-light truncate max-w-[150px]">{item.description}</p>
            )}
          </div>
        ];
      },
      type: "column",
      bold: true,
    },
    {
      header: "CATEGORY",
      sortable: true,
      sortField: "category",
      value: (item: Expense) => {
        const color = getCategoryColor(item.category);
        const icon = getCategoryIcon(item.category);
        return [
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color: color }}
            key={item.uuid}
          >
            {icon} {item.category}
          </span>
        ];
      },
      type: "column",
    },
    {
      header: "AMOUNT",
      sortable: true,
      sortField: "amount",
      value: (item: Expense) => {
        return [
          <span className="text-sm font-semibold text-text" key={item.uuid}>
            {formatCurrency(item.amount)}
          </span>
        ];
      },
      type: "column",
      bold: true,
    },
    {
      header: "DATE",
      sortable: true,
      sortField: "date",
      value: (item: Expense) => {
        return [
          <span className="text-sm text-text-light" key={item.uuid}>
            {formatDate(item.date)}
          </span>
        ];
      },
      type: "column",
    },
    {
      header: "PAYMENT",
      value: (item: Expense) => {
        return [
          <span className="text-xs text-text-light flex items-center gap-1" key={item.uuid}>
            <span>{getPaymentMethodIcon(item.payment_method)}</span>
            {getPaymentMethodLabel(item.payment_method)}
          </span>
        ];
      },
      type: "column",
    },
    {
      header: "STATUS",
      sortable: true,
      sortField: "status",
      value: (item: Expense) => {
        return [
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(item.status)}`}
            key={item.uuid}
          >
            {getStatusLabel(item.status)}
          </span>
        ];
      },
      type: "column",
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const getCustomActions = (item: Expense) => {
    const actions = [];

    if (item.status === 'pending') {
      actions.push({
        title: "Approve",
        icon: "check",
        handler: () => handleApproveExpense(item),
        classes: "text-emerald-600",
      });
    }

    if (item.status === 'pending') {
      actions.push({
        title: "Edit",
        icon: "edit",
        handler: () => handleEditExpense(item),
      });

      actions.push({
        title: "Delete",
        icon: "delete",
        handler: () => handleDeleteExpense(item),
        classes: "text-danger",
      });
    }

    return actions;
  };

  // ── Filter / sort option lists ─────────────────────────────────────────────
  const filterOptions = [
    { value: "all", label: "All Expenses" },
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
            onClick={() => fetchExpenses()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Expense Tracker</h2>
          <p className="text-text-light text-sm">Manage and monitor all business expenses</p>
        </div>
        <Button onClick={handleAddExpense}>
          <Plus className="w-5 h-5" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
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

        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
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

        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-4">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
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

        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-text mb-4">Category Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown.filter((c) => c.spent > 0)}
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
                  {categoryBreakdown
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        placeholder="Search by title, description, or category..."
        searchLabel="Search Expenses"
        noDataMessage={
          searchQuery || filterCategory || filterStatus || dateRange.start || dateRange.end
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
        onDateRangeChange={handleDateRangeChange}
        onAdd={handleAddExpense}
      />
    </div>
  );
};

export default ExpenseTracker;