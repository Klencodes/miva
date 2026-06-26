import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button, DataTable } from '../../components/common';
import { ColumnDef } from '../../components/common/Datatable';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Invoice } from '../../core/types';
import InvoiceService from "../../core/services/invoice";
import { eventService } from '../../core/services/events';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useModal } from '../../core/hooks/useModal';
import { generateCode } from '../../core/utils/id-generator';
import { useStore } from '../../core/contexts/StoreProvider';
import { DateFormatEnums } from '../../core/utils/date-format';

const Invoicing = () => {
  const navigate = useNavigate();
  usePageTitle("Invoices");
  const { openModal } = useModal();
  const { entity } = useStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 10;

  // ── Refs to always have latest values without re-creating fetch ────────────
  const searchRef = useRef(searchQuery);
  const filterStatusRef = useRef(filterStatus);
  const filterPaymentRef = useRef(filterPayment);
  const pageRef = useRef(page);

  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { filterStatusRef.current = filterStatus; }, [filterStatus]);
  useEffect(() => { filterPaymentRef.current = filterPayment; }, [filterPayment]);
  useEffect(() => { pageRef.current = page; }, [page]);

  // ── Helper functions ──────────────────────────────────────────────────────
  const getPaymentMethod = (invoice: Invoice): string => {
    if (!invoice) return 'Cash';
    if (invoice.payments && Array.isArray(invoice.payments) && invoice.payments.length > 0) {
      return invoice.payments[0].method || 'Cash';
    }
    return 'Cash';
  };

  const getPaymentStatus = (invoice: Invoice): string => {
    if (!invoice) return 'Unpaid';
    if (invoice.remaining_balance <= 0) return 'Paid';
    if (invoice.amount_paid > 0) return 'Partial';
    return 'Unpaid';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      invoiced: 'bg-emerald-100 text-emerald-700',
      quoted: 'bg-amber-100 text-amber-700',
      draft: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
      paid: 'bg-emerald-100 text-emerald-700',
      partially: 'bg-amber-100 text-amber-700',
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

  // ── Fetch (stable, never recreated) ───────────────────────────────────────
  const fetchInvoices = useRef(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pageRef.current,
        limit: LIMIT,
      };

      if (searchRef.current) {
        params.search = searchRef.current;
      }

      if (filterStatusRef.current !== 'all') {
        params.status = filterStatusRef.current;
      }

      if (filterPaymentRef.current !== 'all') {
        params.payment_status = filterPaymentRef.current;
      }

      const response = await InvoiceService.getInvoices(params);

      if (response.success) {
        setInvoices(response.results || []);
        setCount(response.count || 0);
      } else {
        toast.error('Error', { description: response.message || 'Failed to load invoices' });
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Error', { description: error.message || 'Failed to load invoices' });
    } finally {
      setLoading(false);
    }
  }).current;

  // ── Trigger fetch when page / search / filter / refreshKey change ──────────
  useEffect(() => {
    fetchInvoices();
    //eslint-disable-next-line
  }, [page, searchQuery, filterStatus, filterPayment, refreshKey]);

  // ── Listen for refresh events ──────────────────────────────────────────────
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    eventService.onRefresh(handleRefresh);
    return () => eventService.offRefresh(handleRefresh);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    searchRef.current = query;
    pageRef.current = 1;
    setSearchQuery(query);
  };

  const handleFilter = (filter: string) => {
    // Determine if filter is for status or payment
    const statusValues = ['all', 'invoiced', 'quoted', 'draft', 'cancelled', 'paid', 'partially', 'overdue'];
    const paymentValues = ['all', 'Paid', 'Partial', 'Unpaid'];

    if (statusValues.includes(filter)) {
      filterStatusRef.current = filter;
      setFilterStatus(filter);
    } else if (paymentValues.includes(filter)) {
      filterPaymentRef.current = filter;
      setFilterPayment(filter);
    }

    pageRef.current = 1;
    setPage(1);
  };

  const handleSort = (sortValue: string) => {
    if (!sortValue) return;
    const [field, direction] = sortValue.split('_');
    const dir = direction as 'asc' | 'desc';

    setInvoices((prev) =>
      [...prev].sort((a, b) => {
        let cmp = 0;

        switch (field) {
          case 'number':
            cmp = a.number.localeCompare(b.number);
            break;
          case 'customer':
            cmp = (a.customer?.name || '').localeCompare(b.customer?.name || '');
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
          case 'paymentMethod': {
            const methodA = getPaymentMethod(a);
            const methodB = getPaymentMethod(b);
            cmp = methodA.localeCompare(methodB);
            break;
          }
          case 'paymentStatus': {
            const statusA = getPaymentStatus(a);
            const statusB = getPaymentStatus(b);
            cmp = statusA.localeCompare(statusB);
            break;
          }
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

  // ── Navigation handlers ──────────────────────────────────────────────────
  const onNewInvoice = () => {
    navigate('/invoices/create');
  };

  const onViewInvoice = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.uuid}`, { state: { invoice } });
  };

  const onPrintInvoice = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.uuid}`, { state: { invoice, print: true } });
  };

  const onEditInvoice = (invoice: Invoice) => {
    navigate(`/invoices/edit/${invoice.uuid}`, {
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
  };

  const onCopyInvoice = async (invoice: Invoice) => {
    if (!invoice) return;

    try {
      const copyData = {
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email || "",
          phone: invoice.customer.phone || "",
          address: invoice.customer.address || "",
          tax_id: invoice.customer.tax_id || "",
        },
        items: invoice.items.map((item) => ({
          id: item.id,
          name: item.name,
          part_number: item.part_number,
          type: item.type,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost || 0,
          specs: item.specs || {},
        })),
        number: generateCode(entity?.metadata?.invoice_prefix),
        date: new Date().toISOString(),
        discount_type: invoice.discount_type || "percentage",
        discount_rate: invoice.discount_rate || 0,
        vat_rate: invoice.vat_rate || 12.5,
        notes: `Duplicate of ${invoice.number}${invoice.notes ? ` - ${invoice.notes}` : ""}`,
        terms: invoice.terms || "Due on Receipt",
        currency: invoice.currency || "GHC",
        status: "draft" as any,
        payments: [],
        amount_paid: 0,
      };

      const response = await InvoiceService.create(copyData);

      if (response.success) {
        toast.success("Success", {
          description: `Invoice ${invoice.number} duplicated successfully`,
        });
        navigate(`/invoices/${response.results.invoice.uuid}`);
      }
    } catch (error: any) {
      console.error("Error duplicating invoice:", error);
      toast.error("Error", {
        description: error.message || "Failed to duplicate invoice",
      });
    }
  };

  const onMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await InvoiceService.markAsPaid(invoiceId);

      if (response.success) {
        toast.success('Success', {
          description: 'Invoice marked as paid successfully'
        });
        fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Error', {
        description: error.message || 'Failed to mark invoice as paid'
      });
    }
  };

  const onCancelInvoice = async (invoiceId: string) => {
    try {
      const result = await openModal(ConfirmModal, {
        data: {
          title: 'Cancel Invoice',
          message: 'Are you sure you want to cancel this invoice?',
          confirmText: 'Cancel Invoice',
          variant: 'warning',
        },
      });

      if (result?.confirmed) {
        const response = await InvoiceService.cancel(invoiceId);

        if (response.success) {
          toast.success('Success', {
            description: 'Invoice cancelled successfully',
          });
          fetchInvoices();
        }
      }
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      toast.error('Error', {
        description: error.message || 'Failed to cancel invoice',
      });
    }
  };

  const onDeleteInvoice = async (invoiceId: string) => {
    try {
      const result = await openModal(ConfirmModal, {
        data: {
          title: 'Delete Invoice',
          message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
          confirmText: 'Delete',
          variant: 'danger',
        },
      });

      if (result?.confirmed) {
        const response = await InvoiceService.delete(invoiceId);

        if (response.success) {
          toast.success('Success', {
            description: 'Invoice deleted successfully',
          });
          fetchInvoices();
        }
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error('Error', {
        description: error.message || 'Failed to delete invoice',
      });
    }
  };

  // ── Column definitions ─────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      header: 'INVOICE #',
      sortable: true,
      sortField: 'number',
      value: (item: Invoice) => item.number,
      type: 'column',
      bold: true,
      link: (item: Invoice) => `/invoices/${item.uuid}`,
    },
    {
      header: 'CUSTOMER',
      sortable: true,
      sortField: 'customer',
      value: (item: Invoice) => item.customer?.name || "Walk-In",
      type: 'column',
    },
    {
      header: 'DATE',
      sortable: true,
      sortField: 'date',
      value: (item: Invoice) => item.date,
      type: 'date',
      format: DateFormatEnums.MEDIUM_DATE,
    },
    {
      header: 'TOTAL',
      sortable: true,
      sortField: 'total',
      value: (item: Invoice) => `GHS ${item.total.toFixed(2)}`,
      type: 'column',
      bold: true,
    },
    {
      header: 'PAYMENT PROGRESS',
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
      type: 'column',
    },
    {
      header: 'PAYMENT',
      sortable: true,
      sortField: 'paymentMethod',
      value: (item: Invoice) => {
        const method = getPaymentMethod(item);
        return `${getPaymentMethodIcon(method)} ${method}`;
      },
      type: 'column',
    },
    {
      header: 'STATUS',
      sortable: true,
      sortField: 'status',
      value: (item: Invoice) => item.status,
      type: 'status',
      statusClasses: (item: Invoice) => getStatusColor(item.status),
    },
    {
      header: 'PAYMENT STATUS',
      sortable: true,
      sortField: 'paymentStatus',
      value: (item: Invoice) => getPaymentStatus(item),
      type: 'status',
      statusClasses: (item: Invoice) => getPaymentStatusColor(getPaymentStatus(item)),
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const getCustomActions = (item: Invoice) => {
    const actions = [];
    const paymentStatus = getPaymentStatus(item);

    actions.push({
      title: 'View Details',
      icon: 'view',
      handler: () => onViewInvoice(item),
    });

    actions.push({
      title: 'Print / PDF',
      icon: 'copy',
      handler: () => onPrintInvoice(item),
    });

    if (item.status === 'draft' || item.status === 'quoted') {
      actions.push({
        title: 'Edit',
        icon: 'edit',
        handler: () => onEditInvoice(item),
      });
    }

    actions.push({
      title: 'Duplicate',
      icon: 'copy',
      handler: () => onCopyInvoice(item),
    });

    if ((item.status === 'invoiced' || paymentStatus === 'Partial') && paymentStatus !== 'Paid') {
      actions.push({
        title: 'Mark as Paid',
        icon: 'check',
        handler: () => onMarkAsPaid(item.uuid || item.uuid),
        classes: 'text-emerald-600',
      });
    }

    if (item.status !== 'cancelled' && item.status !== 'draft') {
      actions.push({
        title: 'Cancel Invoice',
        icon: 'delete',
        handler: () => onCancelInvoice(item.uuid || item.uuid),
        classes: 'text-danger',
      });
    }

    if (item.status === 'draft' || item.status === 'quoted') {
      actions.push({
        title: 'Delete',
        icon: 'delete',
        handler: () => onDeleteInvoice(item.uuid || item.uuid),
        classes: 'text-danger',
      });
    }

    return actions;
  };

  // ── Filter / sort option lists ─────────────────────────────────────────────
  const filterOptions = [
    // Status filters
    { value: 'all', label: 'All Statuses' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'draft', label: 'Draft' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially', label: 'Partially Paid' },
    { value: 'overdue', label: 'Overdue' },
    // Payment status filters
    { value: 'all', label: 'All Payments' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Unpaid', label: 'Unpaid' },
  ];

  const sortOptions = [
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Invoices</h2>
          <p className="text-text-light text-sm">Manage and track all your invoices</p>
        </div>
        <Button onClick={onNewInvoice}>
          <Plus className="w-5 h-5" />
          New Invoice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        placeholder="Search by invoice number, customer, or email..."
        searchLabel="Search Invoices"
        noDataMessage={
          searchQuery || filterStatus !== 'all' || filterPayment !== 'all'
            ? 'No invoices match your filters'
            : 'No invoices found. Create your first invoice!'
        }
        addButtonText="Create Invoice"
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
        onAdd={onNewInvoice}
      />
    </div>
  );
};

export default Invoicing;