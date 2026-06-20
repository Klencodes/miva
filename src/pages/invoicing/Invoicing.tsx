import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { SelectOption } from '../../components/common/Input';
import { Button, DataTable } from '../../components/common';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DiscountType, InvItemType, InvItemUnitType, Invoice, InvStatus } from '../../core/types';
import InvoiceService from "../../core/services/invoice";
import { defaultSystemSettings } from '../../data/sampleData';

const Invoicing = () => {
  const navigate = useNavigate();

  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date_desc');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Fetch invoices from API
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params: any = {
        page,
        limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedFilter !== 'all') {
        params.status = selectedFilter;
      }

      if (dateRange.start) {
        params.date_from = dateRange.start.toISOString();
      }

      if (dateRange.end) {
        params.date_to = dateRange.end.toISOString();
      }

      const response = await InvoiceService.getInvoices(params);
      
      if (response.success) {
        const invoiceData = response.results?.invoices || [];
        setInvoices(invoiceData);
        setCount(response.results?.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Error', {
        description: error.message || 'Failed to load invoices'
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, selectedFilter, dateRange]);

  // Load invoices on mount and when dependencies change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter options
  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'draft', label: 'Draft' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const paymentStatusOptions: SelectOption[] = [
    { value: 'all', label: 'All Payments' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Unpaid', label: 'Unpaid' },
  ];

  const sortOptions: SelectOption[] = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'total_desc', label: 'Highest Total' },
    { value: 'total_asc', label: 'Lowest Total' },
    { value: 'customer_asc', label: 'Customer A-Z' },
    { value: 'customer_desc', label: 'Customer Z-A' },
    { value: 'status_asc', label: 'Status A-Z' },
    { value: 'status_desc', label: 'Status Z-A' },
    { value: 'paymentStatus_asc', label: 'Payment Status A-Z' },
    { value: 'paymentStatus_desc', label: 'Payment Status Z-A' },
  ];

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      invoiced: 'bg-emerald-100 text-emerald-700',
      quoted: 'bg-amber-100 text-amber-700',
      draft: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
      paid: 'bg-emerald-100 text-emerald-700',
      partially_paid: 'bg-amber-100 text-amber-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Paid: 'bg-emerald-100 text-emerald-700',
      Partial: 'bg-amber-100 text-amber-700',
      Unpaid: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      Cash: '💵',
      MoMo: '📱',
      Bank: '🏦',
      Credit: '📋',
    };
    return icons[method] || '💰';
  };

  // Sort function - similar to Inventory component's approach
  const handleSort = useCallback((sortValue: string) => {
    if (!sortValue) return;
    setSelectedSort(sortValue);
    setPage(1);
    console.log('Sorting by:', sortValue);
  }, []);

  // Filter and search invoices (frontend filtering)
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply status filter
    if (selectedFilter !== 'all') {
      result = result.filter(inv => 
        inv.status === selectedFilter
      );
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.number.toLowerCase().includes(search) ||
        inv.customer?.name.toLowerCase().includes(search) ||
        inv.customer?.email?.toLowerCase().includes(search) ||
        inv.number.toLowerCase().includes(search)
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      result = result.filter(inv => new Date(inv.date) >= dateRange.start!);
    }
    if (dateRange.end) {
      result = result.filter(inv => new Date(inv.date) <= dateRange.end!);
    }

    return result;
  }, [invoices, selectedFilter, searchTerm, dateRange]);

  // Sort the filtered invoices
  const sortedInvoices = useMemo(() => {
    const result = [...filteredInvoices];
    
    if (!selectedSort) return result;

    const [field, direction] = selectedSort.split('_');
    const dir = direction as 'asc' | 'desc';

    return result.sort((a, b) => {
      let cmp = 0;
      
      switch (field) {
        case 'number':
          cmp = a.number.localeCompare(b.number);
          break;
        case 'customer':
          cmp = a.customer?.name.localeCompare(b.customer?.name);
          break;
        case 'date':
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'total':
          cmp = a.total - b.total;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'paymentMethod':
          cmp = a.payments[0].method.localeCompare(b.payments[0].method);
          break;
        default:
          cmp = 0;
      }
      
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [filteredInvoices, selectedSort]);

  // Update count when filtered results change
  useEffect(() => {
    setCount(sortedInvoices.length);
  }, [sortedInvoices.length]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedInvoices.slice(start, end);
  }, [sortedInvoices, page, limit]);

  // Handler functions
  const onNewInvoice = useCallback(() => {
    navigate('/invoices/create');
  }, [navigate]);

  const onViewInvoice = useCallback((invoice: Invoice) => {
    navigate(`/invoices/${invoice.uuid || invoice.uuid}`, { state: { invoice } });
  }, [navigate]);

  const onPrintInvoice = useCallback((invoice: Invoice) => {
    navigate(`/invoices/${invoice.uuid || invoice.uuid}`, { state: { invoice, print: true } });
  }, [navigate]);

  const onEditInvoice = useCallback((invoice: Invoice) => {
    navigate(`/invoices/edit/${invoice.uuid || invoice.uuid}`, { 
      state: { 
        invoice: {
          ...invoice,
          date: invoice.date,
          dueDate: invoice.due_date,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
        }
      } 
    });
  }, [navigate]);

  const onCopyInvoice = useCallback(async (invoice: Invoice) => {
    try {
      // Create a copy of the invoice
      const copyData = {
        customer: {
          name: invoice.customer?.name || '',
          email: invoice.customer?.email || '',
          phone: invoice.customer?.phone || '',
          address: invoice.customer?.address || '',
        },
        items: invoice.items.map(item => ({
          id: item.id,
          name: item.description || '',
          quantity: item.quantity,
          price: item.price,
          cost: 0,
          unit: 'pieces' as InvItemUnitType,
          type: 'other' as InvItemType,
        })),
        date: new Date().toISOString(),
        discount_type: 'percentage' as DiscountType,
        discount_rate: 0,
        vat_rate: defaultSystemSettings.taxRate,
        notes: `Duplicate of ${invoice.number} - ${invoice.notes || ''}`,
        terms: invoice.terms || 'Due on Receipt',
        currency: 'GHS',
        status: 'draft' as InvStatus,
        payment_pethod: invoice.payments[0].method || 'Cash',
      };

      const response = await InvoiceService.createInvoice(copyData);
      
      if (response.success) {
        toast.success('Success', {
          description: `Invoice ${invoice.number} duplicated successfully`
        });
        fetchInvoices(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error copying invoice:', error);
      toast.error('Error', {
        description: error.message || 'Failed to duplicate invoice'
      });
    }
  }, [fetchInvoices]);

  const onMarkAsPaid = useCallback(async (invoiceId: string) => {
    try {
      const response = await InvoiceService.markAsPaid(invoiceId);
      
      if (response.success) {
        toast.success('Success', {
          description: 'Invoice marked as paid successfully'
        });
        fetchInvoices(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Error', {
        description: error.message || 'Failed to mark invoice as paid'
      });
    }
  }, [fetchInvoices]);

  const onCancelInvoice = useCallback(async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    
    try {
      const response = await InvoiceService.cancelInvoice(invoiceId);
      
      if (response.success) {
        toast.success('Success', {
          description: 'Invoice cancelled successfully'
        });
        fetchInvoices(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      toast.error('Error', {
        description: error.message || 'Failed to cancel invoice'
      });
    }
  }, [fetchInvoices]);

  const onDeleteInvoice = useCallback(async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    
    try {
      const response = await InvoiceService.deleteInvoice(invoiceId);
      
      if (response.success) {
        toast.success('Success', {
          description: 'Invoice deleted successfully'
        });
        fetchInvoices(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error('Error', {
        description: error.message || 'Failed to delete invoice'
      });
    }
  }, [fetchInvoices]);

  const onSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const onFilter = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setPage(1);
  }, []);

  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
    console.log('Page changed to:', newPage);
  }, []);

  const onDateRangeChange = useCallback((start?: Date, end?: Date) => {
    setDateRange({ start, end });
    setPage(1);
    console.log('Date range changed:', { start, end });
  }, []);

  // Table columns definition
  const columns = [
    {
      header: 'Invoice #',
      value: (item: Invoice) => item.number,
      type: 'column' as const,
      bold: true,
      sortable: true,
      sortField: 'number',
      onClick: (item: Invoice) => onViewInvoice(item),
    },
    {
      header: 'Customer',
      value: (item: Invoice) => item.customer?.name || "Walk-In",
      type: 'column' as const,
      sortable: true,
      sortField: 'customer'
    },
    {
      header: 'Date',
      value: (item: Invoice) => item.date,
      type: 'date' as const,
      sortable: true,
      sortField: 'date',
      format: 'MMM dd, yyyy',
    },
    {
      header: 'Total',
      value: (item: Invoice) => `GHS ${item.total.toFixed(2)}`,
      type: 'column' as const,
      sortable: true,
      sortField: "total",
      bold: true,
    },
    {
      header: 'Payment Progress',
      value: (item: Invoice) => {
        const percent = item.total > 0 ? (item.amount_paid / item.total) * 100 : 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-light">Paid</span>
              <span className="font-medium">{percent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  percent >= 100 ? 'bg-emerald-500' : 
                  percent > 0 ? 'bg-amber-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-emerald-600">GHS {item.amount_paid.toFixed(2)}</span>
              <span className="text-text-light">GHS {item.total.toFixed(2)}</span>
            </div>
          </div>
        );
      },
      type: 'column' as const,
    },
    {
      header: 'Payment',
      sortable: true,
      sortField: "paymentMethod",
      value: (item: Invoice) => `${getPaymentMethodIcon(item.payments[0].method)} ${item.payments[0].method}`,
      type: 'column' as const,
    },
    {
      header: 'Status',
      sortable: true,
      sortField: "status",
      value: (item: Invoice) => item.status,
      type: 'status' as const,
      statusClasses: (item: Invoice) => getStatusColor(item.status),
    },
    {
      header: 'Payment Status',
      sortable: true,
      sortField: "paymentStatus",
      value: (item: Invoice) => item.payments[0].method,
      type: 'status' as const,
      statusClasses: (item: Invoice) => getPaymentStatusColor(item.payments[0].method),
    },
  ];

  // Custom actions for each invoice row
  const getCustomActions = useCallback((item: Invoice) => {
    const actions = [];

    // View action
    actions.push({
      title: 'View Details',
      icon: 'view',
      handler: () => onViewInvoice(item),
    });

    // Print action
    actions.push({
      title: 'Print / PDF',
      icon: 'copy',
      handler: () => onPrintInvoice(item),
    });

    // Edit action (only for draft and quoted)
    if (item.status === 'draft' || item.status === 'quoted') {
      actions.push({
        title: 'Edit',
        icon: 'edit',
        handler: () => onEditInvoice(item),
      });
    }

    // Copy action
    actions.push({
      title: 'Duplicate',
      icon: 'copy',
      handler: () => onCopyInvoice(item),
    });

    // Mark as paid (only for invoiced and not paid)
    if ((item.status === 'invoiced' || item.payment_status === 'partially') && item.payment_status !== 'paid') {
      actions.push({
        title: 'Mark as Paid',
        icon: 'check',
        handler: () => onMarkAsPaid(item.uuid || item.uuid),
        classes: 'text-emerald-600',
      });
    }

    // Cancel action (only for invoiced and not cancelled)
    if (item.status !== 'cancelled' && item.status !== 'draft') {
      actions.push({
        title: 'Cancel Invoice',
        icon: 'delete',
        handler: () => onCancelInvoice(item.uuid || item.uuid),
        classes: 'text-danger',
      });
    }

    // Delete action (only for draft and quoted)
    if (item.status === 'draft' || item.status === 'quoted') {
      actions.push({
        title: 'Delete',
        icon: 'delete',
        handler: () => onDeleteInvoice(item.uuid || item.uuid),
        classes: 'text-danger',
      });
    }

    return actions;
  }, [onViewInvoice, onPrintInvoice, onEditInvoice, onCopyInvoice, onMarkAsPaid, onCancelInvoice, onDeleteInvoice]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Invoices</h2>
          <p className="text-text-light text-sm">Manage and track all your invoices</p>
          <div className="flex gap-4 mt-2 text-sm flex-wrap">
            <span>Total: {sortedInvoices.length}</span>
            <span className="text-emerald-600">
              Paid: {sortedInvoices.filter(inv => inv.payment_status === 'paid').length}
            </span>
            <span className="text-amber-600">
              Partial: {sortedInvoices.filter(inv => inv.payment_status === 'partially').length}
            </span>
            <span className="text-red-600">
              Unpaid: {sortedInvoices.filter(inv => inv.payment_status === 'unpaid').length}
            </span>
          </div>
        </div>
        <Button
          onClick={onNewInvoice}
        >
          <Plus className="w-5 h-5" />
          New Invoice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        placeholder="Search invoices by number, customer, or email..."
        searchLabel="Search Invoices"
        noDataMessage={
          searchTerm || selectedFilter !== 'all' || dateRange.start || dateRange.end
            ? "No invoices match your filters"
            : "No invoices found. Create your first invoice!"
        }
        addButtonText="Create Invoice"
        page={page}
        limit={limit}
        count={count}
        sortOptions={sortOptions}
        filterOptions={[...statusOptions, ...paymentStatusOptions]}
        customActions={getCustomActions}
        onSearch={onSearch}
        onFilter={onFilter}
        onSort={handleSort}
        onPageChange={onPageChange}
        onDateRangeChange={onDateRangeChange}
        onAdd={onNewInvoice}
      />
    </div>
  );
};

export default Invoicing;