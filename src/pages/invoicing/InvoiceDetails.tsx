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
  Download,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Invoice } from '../../core/types';
import { Button } from '../../components/common';
import { DateFormatEnums, formatDate } from '../../core/utils/date-format';

const InvoiceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Get invoice operations from store

  // Load invoice from navigation state or fetch by ID
  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      
      // First, try to get invoice from navigation state
      const stateInvoice = location.state?.invoice as Invoice;
      
      if (stateInvoice) {
        console.log('Invoice from navigation state:', stateInvoice);
        setInvoice(stateInvoice);
        setLoading(false);
        return;
      }

      // If not in state, fetch by ID from store
      if (id) {
        // const fetchedInvoice = getInvoiceById(id);
        // if (fetchedInvoice) {
        //   console.log('Invoice fetched by ID:', fetchedInvoice);
        //   setInvoice(fetchedInvoice);
        // } else {
        //   // Invoice not found
        //   setInvoice(null);
        // }
      }
      
      setLoading(false);
    };

    loadInvoice();
  }, [id, location.state]);

  // Handle print action from navigation state
  useEffect(() => {
    if (location.state?.print && invoice) {
      // Delay print to ensure DOM is ready
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [location.state?.print, invoice]);

  // Handle mark as paid action from navigation state
  useEffect(() => {
    if (location.state?.action === 'mark-paid' && invoice) {
      handleMarkAsPaid();
    }
  }, [location.state?.action, invoice]);

  // Handle cancel action from navigation state
  useEffect(() => {
    if (location.state?.action === 'cancel' && invoice) {
      // Show confirmation before cancelling
      if (window.confirm(`Are you sure you want to cancel invoice ${invoice.number}?`)) {
        handleCancelInvoice();
      }
    }
  }, [location.state?.action, invoice]);

  const handleBack = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);

  const handlePrint = useCallback(() => {
    const printContent = printRef.current;
    if (!printContent) {
      alert('Print content not found');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      alert('Please allow popups to print the invoice');
      return;
    }

    // Get all styles from the document
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

  const handleEdit = useCallback(() => {
    if (invoice) {
      navigate(`/invoices/edit/${invoice.id}`, { 
        state: { invoice } 
      });
    }
  }, [invoice, navigate]);

  const handleDuplicate = useCallback(() => {
    if (!invoice) return;
    
    // const duplicated = duplicateInvoice(invoice.id);
    if (invoice) {
      console.log('Duplicated invoice:', invoice    );
      navigate(`/invoices/edit/${invoice.id}`, { 
        state: { invoice: invoice, isDuplicate: true } 
      });
    }
  }, [invoice, navigate]);

  const handleDelete = useCallback(() => {
    if (!invoice) return;
    
    // deleteInvoice(invoice.id);
    setShowDeleteModal(false);
    navigate('/invoices', { 
      state: { message: `Invoice ${invoice.number} has been deleted successfully` } 
    });
  }, [invoice, navigate]);

  const handleMarkAsPaid = useCallback(() => {
    if (!invoice) return;
    
    // markAsPaid(invoice.id);
    // Update local state
    setInvoice({
      ...invoice,
      paymentStatus: 'Paid',
      amountPaid: invoice.total,
    });
    
    console.log('Marking invoice as paid:', invoice.id);
    // Show success message
    alert(`Invoice ${invoice.number} has been marked as paid`);
  }, [invoice]);

  const handleCancelInvoice = useCallback(() => {
    if (!invoice) return;
    
    // cancelInvoice(invoice.id);
    // Update local state
    setInvoice({
      ...invoice,
      status: 'cancelled',
    });
    
    console.log('Cancelling invoice:', invoice.id);
    alert(`Invoice ${invoice.number} has been cancelled`);
  }, [invoice]);

  const handleSendEmail = useCallback(() => {
    if (!invoice) return;
    
    console.log('Sending invoice to:', invoice.customerEmail);
    // In a real app, you would call an API endpoint
    alert(`Invoice ${invoice.number} has been sent to ${invoice.customerEmail || 'the customer'}`);
  }, [invoice]);

  const getStatusBadge = (status: string) => {
    const config = {
      invoiced: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Invoiced' },
      quoted: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Quoted' },
      draft: { color: 'bg-slate-100 text-slate-700', icon: FileText, label: 'Draft' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
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
            className="mt-4 px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const canEdit = invoice.status === 'draft' || invoice.status === 'quoted';
  const canDelete = invoice.status === 'draft' || invoice.status === 'quoted';
  const canMarkPaid = invoice.status === 'invoiced' && invoice.paymentStatus !== 'Paid';
  const isCancelled = invoice.status === 'cancelled';

  return (
    <div className="">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with actions */}
        <div className="max-w-7xl overflow-y-auto  shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 transition-colors"
                title="Back to invoices"
              >
                <ArrowLeft className="w-5 h-5 text-text-light" />
              </button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-text">{invoice.number}</h1>
                  {getStatusBadge(invoice.status)}
                  {getPaymentStatusBadge(invoice.paymentStatus)}
                </div>
                <p className="text-sm text-text-light mt-1">
                  Created on {formatDate(new Date(invoice.date), DateFormatEnums.DATE_TIME_SHORT)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Print Button */}
              <Button
                onClick={handlePrint}
                variant='ghost'
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>

           

              {/* Email Button */}
              <Button
                onClick={handleSendEmail}
                variant="ghost"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>

              {/* Duplicate Button */}
              <Button
              variant="ghost"
                onClick={handleDuplicate}
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </Button>

              {/* Edit Button - only for draft and quoted */}
              {canEdit && (
                <Button
                variant="info"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}

              {/* Mark as Paid Button */}
              {canMarkPaid && (
                <Button
                  onClick={handleMarkAsPaid}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Paid
                </Button>
              )}

              {/* Delete Button - only for draft and quoted */}
              {canDelete && (
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="danger">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Content - Print Area */}
        <div ref={printRef} className="bg-card  shadow-sm p-8 print:shadow-none">
          <div className="max-w-4xl mx-auto">
            {/* Invoice Header */}
            <div className="border-b border-border pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-text">INVOICE</h2>
                  <p className="text-text-light mt-1"># {invoice.number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-light">Date</p>
                  <p className="font-medium">{formatDate(new Date(invoice.date), DateFormatEnums.MEDIUM_DATE)}</p>
                  {invoice.dueDate && (
                    <>
                      <p className="text-sm text-text-light mt-2">Due Date</p>
                      <p className="font-medium">{formatDate(new Date(invoice.dueDate), DateFormatEnums.MEDIUM_DATE)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Bill To</h3>
                <div className="bg-background p-4">
                  <p className="font-semibold text-text">{invoice.customer}</p>
                  {invoice.customerAddress && (
                    <div className="flex items-start gap-2 mt-2 text-text-light">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{invoice.customerAddress}</p>
                    </div>
                  )}
                  {invoice.customerEmail && (
                    <div className="flex items-center gap-2 mt-2 text-text-light">
                      <Mail className="w-4 h-4" />
                      <p className="text-sm">{invoice.customerEmail}</p>
                    </div>
                  )}
                  {invoice.customerPhone && (
                    <div className="flex items-center gap-2 mt-2 text-text-light">
                      <Phone className="w-4 h-4" />
                      <p className="text-sm">{invoice.customerPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Payment Details</div>
                <div className="bg-background p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(invoice.paymentMethod)}
                    <span className="text-sm font-medium">{invoice.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-light">Status</span>
                    {getPaymentStatusBadge(invoice.paymentStatus)}
                  </div>
                  {invoice.momoTransactionId && (
                    <div className="text-sm text-text-light">
                      <span className="text-text-light">Transaction ID:</span> {invoice.momoTransactionId}
                    </div>
                  )}
                  {invoice.amountPaid && invoice.amountPaid > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-light">Amount Paid</span>
                      <span className="font-medium">GHS {invoice.amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.paymentStatus === 'Unpaid' && (
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-light">Description</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-light">Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-light">Unit Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-light">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="py-3 px-4 text-text">{item.description}</td>
                        <td className="py-3 px-4 text-right text-text-light">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-text-light">GHS {item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium text-text">GHS {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="pt-3">
              <div className="max-w-xs ml-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Subtotal</span>
                    <span>GHS {invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">VAT (12.5%)</span>
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
                    <span>GHS {invoice.covidLevy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-emerald-600">GHS {invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Notes</h4>
                <p className="text-text bg-card p-4">{invoice.notes}</p>
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
                  <span>Powered by GHS Hydraulic Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card  max-w-md w-full p-6 shadow-2xl">
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
                  className="px-4 py-2 text-text bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Additional Status Messages */}
        {isCancelled && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">This invoice has been cancelled. No further actions can be taken.</p>
          </div>
        )}

        {invoice.status === 'invoiced' && invoice.paymentStatus === 'Paid' && (
          <div className="mt-6 p-4 bg-success-5 border border-success-200 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-700">This invoice has been fully paid. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;