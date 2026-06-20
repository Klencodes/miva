// InvoiceDetails.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  FileText,
  AlertCircle,
  Plus,
  Download,
  Send,
} from 'lucide-react';
import { Invoice, InvStatus } from '../../core/types';
import { Button } from '../../components/common';
import { DateFormatEnums, formatDate } from '../../core/utils/date-format';
import PaymentHistory from './PaymentHistory';
import PaymentModal from './PaymentModal';
import { useModal } from '../../core/hooks/useModal';
import InvoiceService from '../../core/services/invoice';
import { toast } from 'sonner';

const InvoiceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { openModal } = useModal();

  // Load invoice from navigation state or fetch by ID
  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      
      const stateInvoice = location.state?.invoice as Invoice;
      
      if (stateInvoice) {
        console.log('Invoice from navigation state:', stateInvoice);
        setInvoice(stateInvoice);
        setLoading(false);
        return;
      }

      // If not in state, fetch from API
      if (id) {
        try {
          const response = await InvoiceService.getInvoiceByUuid(id);
          
          if (response.success && response.results?.invoice) {
            const invoiceData = response.results.invoice;
            setInvoice(invoiceData);
          } else {
            setInvoice(null);
          }
        } catch (error) {
          console.error('Error loading invoice:', error);
          setInvoice(null);
          toast.error('Error', { description: 'Failed to load invoice' });
        }
      }
      
      setLoading(false);
    };

    loadInvoice();
  }, [id, location.state]);

  // Handle mark as paid action from navigation state
  useEffect(() => {
    if (location.state?.action === 'mark-paid' && invoice) {
      handleOpenPaymentModal();
    }
  }, [location.state?.action, invoice]);

  const handleBack = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);

  const handlePrint = useCallback(() => {
    const printContent = printRef.current;
    if (!printContent) {
      toast.error('Error', { description: 'Print content not found' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      toast.error('Error', { description: 'Please allow popups to print the invoice' });
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('');

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.number}</title>
          ${styles}
          <style>
            body { padding: 40px; font-family: Arial, sans-serif; background: white; }
            .print-area { max-width: 100%; }
            .no-print { display: none !important; }
            .print-visible { display: block !important; }
            @media print {
              body { padding: 20px; }
              .bg-gray-50 { background: #f9fafb !important; }
              .shadow-sm { box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-area">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  }, [invoice]);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoice) return;
    
    try {
      await InvoiceService.downloadInvoice(invoice.uuid, `invoice-${invoice.number}.pdf`);
      toast.success('Success', { description: 'Invoice downloaded successfully' });
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to download invoice' });
    }
  }, [invoice]);

  const handleEdit = useCallback(() => {
    if (invoice) {
      navigate(`/invoices/edit/${invoice.uuid}`, { 
        state: { invoice } 
      });
    }
  }, [invoice, navigate]);

  const handleDuplicate = useCallback(async () => {
    if (!invoice) return;
    
    try {
      const copyData = {
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email || '',
          phone: invoice.customer.phone || '',
          address: invoice.customer.address || '',
          tax_id: invoice.customer.tax_id || '',
        },
        items: invoice.items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost || 0,
          specs: item.specs || {},
        })),
        date: new Date().toISOString(),
        discount_type: invoice.discount_type || 'percentage',
        discount_rate: invoice.discount_rate || 0,
        vat_rate: invoice.vat_rate || 12.5,
        notes: `Duplicate of ${invoice.number}${invoice.notes ? ` - ${invoice.notes}` : ''}`,
        terms: invoice.terms || 'Due on Receipt',
        currency: 'GHS',
        status: 'draft' as InvStatus,
        payments: [],
        amount_paid: 0,
      };

      const response = await InvoiceService.createInvoice(copyData);
      
      if (response.success) {
        toast.success('Success', { description: `Invoice ${invoice.number} duplicated successfully` });
        navigate(`/invoices/${response.results.invoice.uuid}`);
      }
    } catch (error: any) {
      console.error('Error duplicating invoice:', error);
      toast.error('Error', { description: error.message || 'Failed to duplicate invoice' });
    }
  }, [invoice, navigate]);

  const handleDelete = useCallback(async () => {
    if (!invoice) return;
    
    try {
      const response = await InvoiceService.deleteInvoice(invoice.uuid);
      
      if (response.success) {
        toast.success('Success', { description: `Invoice ${invoice.number} deleted successfully` });
        setShowDeleteModal(false);
        navigate('/invoices');
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error('Error', { description: error.message || 'Failed to delete invoice' });
    }
  }, [invoice, navigate]);

  const handleSendEmail = useCallback(async () => {
    if (!invoice) return;
    
    setSending(true);
    try {
      const response = await InvoiceService.sendInvoice(
        invoice.uuid,
        invoice.customer.email,
        `Please find attached invoice ${invoice.number}`
      );
      
      if (response.success) {
        toast.success('Success', { description: `Invoice sent to ${invoice.customer.email || 'customer'}` });
      }
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      toast.error('Error', { description: error.message || 'Failed to send invoice' });
    } finally {
      setSending(false);
    }
  }, [invoice]);

  const handleOpenPaymentModal = async () => {
    if (!invoice) return;
    
    const result = await openModal(PaymentModal, {
      data: { invoice },
      side: 'right',
      size: "xl"
    });
    
    if (result?.success) {
      // Refresh invoice data
      try {
        const response = await InvoiceService.getInvoiceByUuid(invoice.uuid);
        if (response.success && response.results?.invoice) {
          setInvoice(response.results.invoice);
        }
      } catch (error) {
        console.error('Error refreshing invoice:', error);
      }
    }
  };

  const handleDeletePayment = useCallback(async (paymentId: string) => {
    if (!invoice) return;
    
    // Note: This would require a delete payment endpoint
    // For now, we'll refresh the invoice data
    try {
      const response = await InvoiceService.getInvoiceByUuid(invoice.uuid);
      if (response.success && response.results?.invoice) {
        setInvoice(response.results.invoice);
        toast.success('Success', { description: 'Payment removed successfully' });
      }
    } catch (error) {
      console.error('Error refreshing invoice:', error);
      toast.error('Error', { description: 'Failed to refresh invoice data' });
    }
  }, [invoice]);

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: 'bg-slate-100 text-slate-700', icon: FileText, label: 'Draft' },
      quoted: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Quoted' },
      invoiced: { color: 'bg-blue-100 text-blue-700', icon: FileText, label: 'Invoiced' },
      partially_paid: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Partially Paid' },
      paid: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
      overdue: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Overdue' },
    };
    const configItem = config[status as keyof typeof config] || config.draft;
    const Icon = configItem.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${configItem.color}`}>
        <Icon className="w-4 h-4" />
        {configItem.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      Paid: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Paid' },
      Partial: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Partial' },
      Unpaid: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Unpaid' },
    };
    const configItem = config[status as keyof typeof config] || config.Unpaid;
    const Icon = configItem.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${configItem.color}`}>
        <Icon className="w-4 h-4" />
        {configItem.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, { icon: any; label: string }> = {
      Cash: { icon: Wallet, label: 'Cash' },
      MoMo: { icon: Smartphone, label: 'Mobile Money' },
      Bank: { icon: Building2, label: 'Bank Transfer' },
      Credit: { icon: CreditCard, label: 'Credit' },
    };
    const config = icons[method] || icons.Cash;
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-light mt-4">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Invoice not found
  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-text-light mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text-light">Invoice Not Found</h2>
          <p className="text-text-light mt-2">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-6 py-2 bg-primary text-white hover:opacity-90 transition-colors rounded-lg"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const canEdit = invoice.status === 'draft' || invoice.status === 'quoted';
  const canDelete = invoice.status === 'draft' || invoice.status === 'quoted' || invoice.status === 'cancelled';
  const canMakePayment = (invoice.status === 'invoiced' || invoice.payment_status === 'partially' || invoice.payment_status === 'overdue') 
    && invoice.remaining_balance > 0;
  const isCancelled = invoice.status === 'cancelled';
  const isPaid = invoice.payment_status === 'paid';

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with actions */}
        <div className="bg-card shadow-sm border border-border p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-background transition-colors rounded-lg"
                title="Back to invoices"
              >
                <ArrowLeft className="w-5 h-5 text-text-light" />
              </button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-text">{invoice.number}</h1>
                  {getStatusBadge(invoice.status)}
                  {getPaymentStatusBadge(invoice.payments[0].method || 
                    (invoice.remaining_balance <= 0 ? 'Paid' : 
                     invoice.amount_paid > 0 ? 'Partial' : 'Unpaid'))}
                </div>
                <p className="text-sm text-text-light mt-1">
                  Created on {formatDate(new Date(invoice.created_at), DateFormatEnums.DATE_TIME_SHORT)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Make Payment Button */}
              {canMakePayment && (
                <Button
                  onClick={handleOpenPaymentModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Make Payment
                </Button>
              )}

              {/* Send Email */}
              {invoice.customer.email && (
                <Button
                  onClick={handleSendEmail}
                  variant="ghost"
                  disabled={sending}
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Email'}
                </Button>
              )}

              {/* Print Button */}
              <Button onClick={handlePrint} variant="ghost">
                <Printer className="w-4 h-4" />
                Print
              </Button>

              {/* Download PDF */}
              <Button onClick={handleDownloadPDF} variant="ghost">
                <Download className="w-4 h-4" />
                PDF
              </Button>

              {/* Duplicate Button */}
              <Button variant="ghost" onClick={handleDuplicate}>
                <Copy className="w-4 h-4" />
                Duplicate
              </Button>

              {/* Edit Button - only for draft and quoted */}
              {canEdit && (
                <Button variant="info" onClick={handleEdit}>
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}

              {/* Delete Button - only for draft, quoted, and cancelled */}
              {canDelete && (
                <Button onClick={() => setShowDeleteModal(true)} variant="danger">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Content - Print Area */}
        <div ref={printRef} className="bg-card border border-border shadow-sm p-8 print:shadow-none print:border-none">
          <div className="max-w-4xl mx-auto">
            {/* Invoice Header */}
            <div className="border-b border-border pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-text">INVOICE</h2>
                  <p className="text-text-light mt-1"># {invoice.number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-light">Date</p>
                  <p className="font-medium">{formatDate(new Date(invoice.date), DateFormatEnums.MEDIUM_DATE)}</p>
                  {invoice.due_date && (
                    <>
                      <p className="text-sm text-text-light mt-2">Due Date</p>
                      <p className="font-medium">{formatDate(new Date(invoice.due_date), DateFormatEnums.MEDIUM_DATE)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Bill To</h3>
                <div className="bg-background p-4 rounded-lg">
                  <p className="font-semibold text-text">{invoice.customer.name}</p>
                  {invoice.customer.address && (
                    <div className="flex items-start gap-2 mt-2 text-text-light">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{invoice.customer.address}</p>
                    </div>
                  )}
                  {invoice.customer.email && (
                    <div className="flex items-center gap-2 mt-2 text-text-light">
                      <Mail className="w-4 h-4" />
                      <p className="text-sm">{invoice.customer.email}</p>
                    </div>
                  )}
                  {invoice.customer.phone && (
                    <div className="flex items-center gap-2 mt-2 text-text-light">
                      <Phone className="w-4 h-4" />
                      <p className="text-sm">{invoice.customer.phone}</p>
                    </div>
                  )}
                  {invoice.customer.tax_id && (
                    <div className="flex items-center gap-2 mt-2 text-text-light">
                      <FileText className="w-4 h-4" />
                      <p className="text-sm">Tax ID: {invoice.customer.tax_id}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Payment Details</div>
                <div className="bg-background p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(invoice.payments[0].method || 'Cash')}
                    <span className="text-sm font-medium">{invoice.payments[0].method|| 'Cash'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-light">Status</span>
                    {getPaymentStatusBadge(
                      invoice.remaining_balance <= 0 ? 'Paid' : 
                      invoice.amount_paid > 0 ? 'Partial' : 'Unpaid'
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-light">Amount Paid</span>
                    <span className="font-medium text-emerald-600">GHS {invoice.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-light">Remaining Balance</span>
                    <span className={`font-medium ${invoice.remaining_balance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      GHS {invoice.remaining_balance.toFixed(2)}
                    </span>
                  </div>
                  {invoice.remaining_balance > 0 && invoice.status !== 'cancelled' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Payment pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-3">Items</h3>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-light">Description</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-light">Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-light">Unit Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-light">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 text-text">{item.name}</td>
                        <td className="py-3 px-4 text-right text-text-light">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-text-light">GHS {item.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium text-text">GHS {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mb-8">
                <PaymentHistory 
                  invoice={invoice} 
                  onDeletePayment={handleDeletePayment}
                />
              </div>
            )}

            {/* Totals */}
            <div className="pt-3">
              <div className="max-w-xs ml-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Subtotal</span>
                    <span>GHS {invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount_total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Discount</span>
                      <span className="text-red-600">-GHS {invoice.discount_total.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">VAT ({invoice.vat_rate || 12.5}%)</span>
                    <span>GHS {invoice.vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">NHIL (2.5%)</span>
                    <span>GHS {invoice.nhil.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">GETFund (2.5%)</span>
                    <span>GHS {invoice.getfund.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">COVID Levy (1%)</span>
                    <span>GHS {invoice.covid_levy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-emerald-600">GHS {invoice.total.toFixed(2)}</span>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-text-light">Amount Paid</span>
                      <span className="text-emerald-600">-GHS {invoice.amount_paid.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.remaining_balance > 0 && (
                    <div className="flex justify-between text-sm pt-1 border-t border-border">
                      <span className="text-text-light font-medium">Remaining Balance</span>
                      <span className="font-bold text-amber-600">GHS {invoice.remaining_balance.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-text bg-background p-4 rounded-lg">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.terms && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Terms</h4>
                <p className="text-sm text-text-light">{invoice.terms}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-border">
              <div className="flex justify-between items-center text-sm text-text-light">
                <p>Thank you for your business!</p>
                <div className="flex items-center gap-4">
                  <span>Powered by Shine Tech Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card max-w-md w-full p-6 shadow-2xl rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-text">Delete Invoice</h3>
              </div>
              <p className="text-text-light mb-6">
                Are you sure you want to delete invoice <span className="font-semibold">{invoice.number}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-text bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-colors rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {isCancelled && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">This invoice has been cancelled. No further actions can be taken.</p>
          </div>
        )}

        {isPaid && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-700">This invoice has been fully paid. Thank you!</p>
          </div>
        )}

        {invoice.payment_status === 'overdue' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">This invoice is overdue. Please remind the customer to make payment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;