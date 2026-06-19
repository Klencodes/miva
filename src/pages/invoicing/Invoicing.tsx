import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { SelectOption } from '../../components/common/Input';
import { Button, DataTable } from '../../components/common';
import { Invoice } from '../../core/types';
import { generateSampleInvoices } from '../../data/sampleData';
import { useNavigate } from 'react-router-dom';

const Invoicing = () => {
  const navigate = useNavigate();

  // State management
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    // Load invoices from localStorage or generate samples
    try {
      const storedInvoices = localStorage.getItem('INVOICES');
      if (storedInvoices) {
        const parsed = JSON.parse(storedInvoices);
        // Convert date strings back to Date objects
        return parsed.map((inv: any) => ({
          ...inv,
          date: new Date(inv.date),
          dueDate: inv.dueDate ? new Date(inv.dueDate) : undefined,
          createdAt: new Date(inv.createdAt),
          updatedAt: new Date(inv.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Error loading invoices from localStorage:', error);
    }
    return generateSampleInvoices();
  });
  
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date_desc');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Save invoices to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('INVOICES', JSON.stringify(invoices));
    } catch (error) {
      console.error('Error saving invoices to localStorage:', error);
    }
  }, [invoices]);

  // Filter options
  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'draft', label: 'Draft' },
    { value: 'cancelled', label: 'Cancelled' },
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
  ];

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      invoiced: 'bg-emerald-100 text-emerald-700',
      quoted: 'bg-amber-100 text-amber-700',
      draft: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
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

  // Sort function
  const sortInvoices = useCallback((invoicesToSort: Invoice[], sortKey: string): Invoice[] => {
    const sorted = [...invoicesToSort];
    
    switch (sortKey) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'total_desc':
        return sorted.sort((a, b) => b.total - a.total);
      case 'total_asc':
        return sorted.sort((a, b) => a.total - b.total);
      case 'customer_asc':
        return sorted.sort((a, b) => a.customer.localeCompare(b.customer));
      case 'customer_desc':
        return sorted.sort((a, b) => b.customer.localeCompare(a.customer));
      default:
        return sorted;
    }
  }, []);

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply status filter
    if (selectedFilter !== 'all') {
      result = result.filter(inv => 
        inv.status === selectedFilter || inv.paymentStatus === selectedFilter
      );
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.number.toLowerCase().includes(search) ||
        inv.customer.toLowerCase().includes(search) ||
        inv.customerEmail?.toLowerCase().includes(search) ||
        inv.id.toLowerCase().includes(search)
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
    return sortInvoices(filteredInvoices, selectedSort);
  }, [filteredInvoices, selectedSort, sortInvoices]);

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
    navigate(`/invoices/${invoice.id}`, { state: { invoice } });
  }, [navigate]);

  const onPrintInvoice = useCallback((invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`, { state: { invoice, print: true } });
  }, [navigate]);

  const onEditInvoice = useCallback((invoice: Invoice) => {
    // Navigate to edit page with invoice data
    navigate(`/invoices/edit/${invoice.id}`, { 
      state: { 
        invoice: {
          ...invoice,
          // Ensure dates are properly formatted
          date: invoice.date,
          dueDate: invoice.dueDate,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
        }
      } 
    });
  }, [navigate]);

  const onCopyInvoice = useCallback((invoice: Invoice) => {
    console.log('Copy invoice:', invoice);
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      number: `INV-${String(Date.now()).slice(-4)}`,
      date: new Date(),
      status: 'draft',
      paymentStatus: 'Unpaid',
      amountPaid: 0,
      notes: `Duplicate of ${invoice.number} - ${invoice.notes || ''}`,
      created_at: new Date(),
      updated_at: new Date(),
    };
    setInvoices(prev => [...prev, newInvoice]);
  }, []);

  const onMarkAsPaid = useCallback((invoiceId: string) => {
    console.log('Mark as paid:', invoiceId);
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, paymentStatus: 'Paid' as const, amountPaid: inv.total, updated_at: new Date() }
        : inv
    ));
  }, []);

  const onCancelInvoice = useCallback((invoiceId: string) => {
    console.log('Cancel invoice:', invoiceId);
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'cancelled' as const, updated_at: new Date() }
          : inv
      ));
    }
  }, []);

  const onDeleteInvoice = useCallback((invoiceId: string) => {
    console.log('Delete invoice:', invoiceId);
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  }, []);

  const onSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const onFilter = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setPage(1);
  }, []);

  const onSort = useCallback((sort: string) => {
    setSelectedSort(sort);
    setPage(1);
    console.log('Sorting by:', sort);
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
      value: (item: Invoice) => item.customer,
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
      align: 'right' as const,
      bold: true,
    },
    {
      header: 'Payment',
      sortable: true,
      sortField: "paymentMethod",
      value: (item: Invoice) => `${getPaymentMethodIcon(item.paymentMethod)} ${item.paymentMethod}`,
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
      value: (item: Invoice) => item.paymentStatus,
      type: 'status' as const,
      statusClasses: (item: Invoice) => getPaymentStatusColor(item.paymentStatus),
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
    if (item.status === 'invoiced' && item.paymentStatus !== 'Paid') {
      actions.push({
        title: 'Mark as Paid',
        icon: 'check',
        handler: () => onMarkAsPaid(item.id),
        classes: 'text-emerald-600',
      });
    }

    // Cancel action (only for invoiced and not cancelled)
    if (item.status === 'invoiced') {
      actions.push({
        title: 'Cancel Invoice',
        icon: 'delete',
        handler: () => onCancelInvoice(item.id),
        classes: 'text-danger',
      });
    }

    // Delete action (only for draft and quoted)
    if (item.status === 'draft' || item.status === 'quoted') {
      actions.push({
        title: 'Delete',
        icon: 'delete',
        handler: () => onDeleteInvoice(item.id),
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
          <div className="flex gap-4 mt-2 text-sm">
            <span>Total: {sortedInvoices.length}</span>
            <span className="text-emerald-600">
              Paid: {sortedInvoices.filter(inv => inv.paymentStatus === 'Paid').length}
            </span>
            <span className="text-amber-600">
              Partial: {sortedInvoices.filter(inv => inv.paymentStatus === 'Partial').length}
            </span>
            <span className="text-red-600">
              Unpaid: {sortedInvoices.filter(inv => inv.paymentStatus === 'Unpaid').length}
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
        onSort={onSort}
        onPageChange={onPageChange}
        onDateRangeChange={onDateRangeChange}
        onAdd={onNewInvoice}
      />
    </div>
  );
};

export default Invoicing;