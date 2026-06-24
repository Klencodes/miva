import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Download,
  Send,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Calendar,
} from "lucide-react";
import { Invoice, InvStatus } from "../../core/types";
import { Button } from "../../components/common";
import { DateFormatEnums, formatDate } from "../../core/utils/date-format";
import PaymentHistory from "./PaymentHistory";
import PaymentModal from "./PaymentModal";
import { useModal } from "../../core/hooks/useModal";
import InvoiceService from "../../core/services/invoice";
import { toast } from "sonner";
import DeleteModal from "./DeleteInvoice";
import { useStore } from "../../core/contexts/StoreProvider";
import SendInvoiceModal from "./SendInvoiceModal";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import { generateCode } from "../../core/utils/id-generator";

const InvoiceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  // const [sending, setSending] = useState(false);
  const { openModal } = useModal();
  const { entity } = useStore();
  usePageTitle("Invoice Details");
  // Get watermark text from entity metadata
  const paymentWatermarkText =
    invoice?.payment_status === "paid"
      ? "PAID"
      : invoice?.payment_status === "unpaid"
        ? "UNPAID"
        : invoice?.payment_status === "partially"
          ? "PARTIALLY"
          : "DRAFT";
  const statusWatermarkText =
    invoice?.status === "invoiced"
      ? "INVOICED"
      : invoice?.status === "draft"
        ? "DRAFT"
        : invoice?.status === "quoted"
          ? "QUOTED"
          : "CANCELLED";
  const watermarkText = `${statusWatermarkText} ${paymentWatermarkText}`;
  // Load invoice from navigation state or fetch by ID
  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);

      const stateInvoice = location.state?.invoice as Invoice;

      if (stateInvoice) {
        setInvoice(stateInvoice);
        setLoading(false);
        return;
      }

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
          console.error("Error loading invoice:", error);
          setInvoice(null);
          toast.error("Error", { description: "Failed to load invoice" });
        }
      }

      setLoading(false);
    };

    loadInvoice();
  }, [id, location.state]);

  useEffect(() => {
    if (location.state?.action === "mark-paid" && invoice) {
      handleOpenPaymentModal();
    }
    //eslint-disable-next-line
  }, [location.state?.action, invoice]);

  const handleBack = useCallback(() => {
    navigate("/invoices");
  }, [navigate]);

  const handlePrint = useCallback(() => {
    const printContent = printRef.current;
    if (!printContent) {
      toast.error("Error", { description: "Print content not found" });
      return;
    }

    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      toast.error("Error", {
        description: "Please allow popups to print the invoice",
      });
      return;
    }

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((el) => el.outerHTML)
      .join("");

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.number}</title>
          ${styles}
          <style>
            body { padding: 40px; font-family: Arial, sans-serif; background: white; }
            .print-area { max-width: 100%; position: relative; }
            .no-print { display: none !important; }
            .print-visible { display: block !important; }
            
            /* Watermark styles */
            .watermark-container {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 999;
              overflow: hidden;
            }
            .watermark-text {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              font-weight: bold;
              color: rgba(0, 0, 0, 0.06);
              white-space: nowrap;
              letter-spacing: 8px;
              font-family: Arial, sans-serif;
              text-transform: uppercase;
            }
            
            @media print {
              body { padding: 20px; }
              .bg-gray-50 { background: #f9fafb !important; }
              .shadow-sm { box-shadow: none !important; }
              .border { border-color: #e5e7eb !important; }
              . { border-radius: 0 !important; }
              .rounded-xl { border-radius: 0 !important; }
              
              .watermark-container {
                position: absolute;
              }
              .watermark-text {
                font-size: 100px;
                color: rgba(0, 0, 0, 0.05);
              }
            }
            
            @media screen {
              .watermark-text {
                font-size: 120px;
                color: rgba(0, 0, 0, 0.04);
              }
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
    // eslint-disable-next-line
  }, [invoice, watermarkText]);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoice) return;

    try {
      await InvoiceService.downloadInvoice(
        invoice.uuid,
        `invoice-${invoice.number}.pdf`,
      );
      toast.success("Success", {
        description: "Invoice downloaded successfully",
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to download invoice",
      });
    }
  }, [invoice]);

  const handleEdit = useCallback(() => {
    if (invoice) {
      navigate(`/invoices/edit/${invoice.uuid}`, {
        state: { invoice },
      });
    }
  }, [invoice, navigate]);

  const handleDuplicate = useCallback(async () => {
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
        status: "draft" as InvStatus,
        payments: [],
        amount_paid: 0,
      };

      const response = await InvoiceService.createInvoice(copyData);

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
  }, [invoice, navigate]);

  const handleSendEmail = useCallback(async () => {
    if (!invoice) return;

    try {
      const result = await openModal(SendInvoiceModal, {
        data: { invoice },
        side: "right",
        size: "md",
      });

      if (result?.success) {
        // Optionally update invoice status or show success
        toast.success("Success", {
          description: `Invoice sent to ${invoice.customer.email || "customer"}`,
        });
      }
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      toast.error("Error", {
        description: error.message || "Failed to send invoice",
      });
    }
  }, [invoice, openModal]);

  const handleOpenPaymentModal = useCallback(async () => {
    if (!invoice) return;

    try {
      const result = await openModal(PaymentModal, {
        data: { invoice },
        side: "right",
        size: "xl",
      });

      if (result?.success) {
        const response = await InvoiceService.getInvoiceByUuid(invoice.uuid);
        if (response.success && response.results?.invoice) {
          setInvoice(response.results.invoice);
          toast.success("Success", {
            description: "Payment added successfully",
          });
        }
      }
    } catch (error: any) {
      console.error("Error opening payment modal:", error);
      toast.error("Error", {
        description: error.message || "Failed to process payment",
      });
    }
  }, [invoice, openModal]);

  const handleOpenDeleteModal = useCallback(async () => {
    if (!invoice) return;

    try {
      const result = await openModal(DeleteModal, {
        data: invoice,
      });

      if (result?.success) {
        navigate("/invoices");
      }
    } catch (error: any) {
      console.error("Error opening delete modal:", error);
      toast.error("Error", {
        description: error.message || "Failed to open delete modal",
      });
    }
  }, [invoice, openModal, navigate]);

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: "bg-background text-text", label: "Draft" },
      quoted: { color: "bg-primary-5 text-primary", label: "Quoted" },
      invoiced: { color: "bg-success-5 text-success", label: "Invoiced" },
      cancelled: { color: "bg-danger-5 text-danger", label: "Cancelled" },
    };
    const configItem = config[status as keyof typeof config] || config.draft;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${configItem.color}`}
      >
        {configItem.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      Paid: { color: "bg-success-5 text-success", label: "Paid" },
      Partial: { color: "bg-primary-5 text-primary", label: "Partial" },
      Unpaid: { color: "bg-info-5 text-info", label: "Unpaid" },
      overdue: { color: "bg-danger-5 text-danger", label: "Overdue" },
    };
    const configItem = config[status as keyof typeof config] || config.Unpaid;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${configItem.color}`}
      >
        {configItem.label}
      </span>
    );
  };

  const getPaymentMethod = (invoice: Invoice | null): string => {
    if (!invoice) return "Cash";
    if (
      invoice.payments &&
      Array.isArray(invoice.payments) &&
      invoice.payments.length > 0
    ) {
      return invoice.payments[0].method || "Cash";
    }
    return "Cash";
  };

  const getPaymentStatus = (invoice: Invoice | null): string => {
    if (!invoice) return "Unpaid";
    if (invoice.remaining_balance <= 0) return "Paid";
    if (invoice.amount_paid > 0) return "Partial";
    return "Unpaid";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-light mt-4 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-text-light mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text-light">
            Invoice Not Found
          </h2>
          <p className="text-text-light mt-2 text-sm">
            The invoice you're looking for doesn't exist.
          </p>
          <button
            onClick={handleBack}
            className="mt-4 px-6 py-2 bg-primary text-white hover:opacity-90 transition-colors  text-sm"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const canEdit = invoice.status === "draft" || invoice.status === "quoted";
  const canDelete =
    invoice.status === "draft" ||
    invoice.status === "quoted" ||
    invoice.status === "cancelled";
  const canMakePayment =
    (invoice.payment_status === "partially" ||
      invoice.payment_status === "overdue" ||
      invoice.payment_status === "unpaid") &&
    invoice.remaining_balance > 0;
  const isCancelled = invoice.status === "cancelled";
  const isPaid = invoice.payment_status === "paid";
  const paymentMethod = getPaymentMethod(invoice);
  const paymentStatus = getPaymentStatus(invoice);

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header - Hidden when printing */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 mb-4 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-background  transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-text-light" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-text">
                    {invoice.number}
                  </h1>
                  {getStatusBadge(invoice.status)}
                  {getPaymentStatusBadge(paymentStatus)}
                </div>
                <p className="text-xs text-text-light mt-0.5">
                  {formatDate(
                    new Date(invoice.created_at),
                    DateFormatEnums.DATE_TIME_SHORT,
                  )}
                </p>
              </div>
            </div>

            {invoice.status !== "cancelled" && (
              <div className="flex flex-wrap gap-1.5">
                {canMakePayment && (
                  <Button onClick={handleOpenPaymentModal}>
                    <Plus className="w-3 h-3" />
                    Make Payment
                  </Button>
                )}

                {invoice.customer.email && (
                  <Button
                    onClick={handleSendEmail}
                    variant="ghost"
                    // disabled={sending}
                    className="px-3 py-1.5 text-xs"
                  >
                    <Send className="w-3 h-3" />
                    {"Email"}
                  </Button>
                )}

                <Button
                  onClick={handlePrint}
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                >
                  <Printer className="w-3 h-3" />
                </Button>

                <Button
                  onClick={handleDownloadPDF}
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                >
                  <Download className="w-3 h-3" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleDuplicate}
                  className="px-3 py-1.5 text-xs"
                >
                  <Copy className="w-3 h-3" />
                </Button>

                {canEdit && (
                  <Button
                    variant="info"
                    onClick={handleEdit}
                    className="px-3 py-1.5 text-xs"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}

                {canDelete && (
                  <Button
                    onClick={handleOpenDeleteModal}
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Content - Print Area with Watermark */}
        <div
          ref={printRef}
          className="bg-white border border-border rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:rounded-none relative"
        >
          {/* Watermark - Diagonal on A4 */}
          {watermarkText && (
            <div className="watermark-container absolute inset-0 pointer-events-none overflow-hidden print:block hidden">
              <div className="watermark-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[80px] font-bold text-black/5 whitespace-nowrap tracking-[8px] uppercase print:text-[100px] print:text-black/5 select-none">
                {watermarkText}
              </div>
            </div>
          )}

          <div className="p-6 print:p-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Invoice Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-2 border-b-2 border-border">
                <div>
                  <h2 className="text-2xl font-bold text-text tracking-tight">
                    INVOICE
                  </h2>
                  <div className="mt-1">
                    <span className="text-sm text-text-light">
                      # {invoice.number}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <span className="text-text-light">Date</span>
                  <span className="text-text font-medium text-right">
                    {formatDate(
                      new Date(invoice.date),
                      DateFormatEnums.MEDIUM_DATE,
                    )}
                  </span>
                  {invoice.due_date && (
                    <>
                      <span className="text-text-light">Due Date</span>
                      <span className="text-text font-medium text-right">
                        {formatDate(
                          new Date(invoice.due_date),
                          DateFormatEnums.MEDIUM_DATE,
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Company, Customer Side by Side */}
              <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8 py-4 border-b border-border print:flex-row print:gap-8">
                {/* Company Info - Left */}
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Company
                  </h3>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-text">
                      {entity?.name || "N/A"}
                    </p>
                    {entity?.address && (
                      <p className="text-text-light text-sm flex items-start gap-2">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{entity.address}</span>
                      </p>
                    )}
                    <div className="space-y-1 text-sm text-text-light">
                      {entity?.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {entity.email}
                        </p>
                      )}
                      {entity?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {entity.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill To - Right */}
                <div className="flex-1 flex flex-col">
                  <div className="max-w-md w-full">
                    <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3 flex items-center justify-end gap-2">
                      <span>Bill To</span>
                      <MapPin className="w-3 h-3" />
                    </h3>
                    <div className="space-y-1.5 text-right">
                      <p className="font-semibold text-text">
                        {invoice.customer.name}
                      </p>
                      {invoice.customer.address && (
                        <p className="text-text-light text-sm">
                          {invoice.customer.address}
                        </p>
                      )}
                      <div className="space-y-1 text-sm text-text-light">
                        {invoice.customer.email && (
                          <p className="flex items-center justify-end gap-2">
                            <span>{invoice.customer.email}</span>
                            <Mail className="w-3 h-3" />
                          </p>
                        )}
                        {invoice.customer.phone && (
                          <p className="flex items-center justify-end gap-2">
                            <span>{invoice.customer.phone}</span>
                            <Phone className="w-3 h-3" />
                          </p>
                        )}
                        {invoice.customer.tax_id && (
                          <p className="text-text-light text-xs flex items-center justify-end gap-2">
                            <span>Tax ID: {invoice.customer.tax_id}</span>
                            <Hash className="w-3 h-3" />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-6">
                <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">
                  Items
                </h3>
                <div className="border border-border  overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                          Description
                        </th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-light uppercase tracking-wider hidden sm:table-cell">
                          Unit Price
                        </th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-2.5 px-4 text-text">{item.name}</td>
                          <td className="py-2.5 px-4 text-right text-text-light">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-4 text-right text-text-light hidden sm:table-cell">
                            {invoice.currency} {item.price.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-text">
                            {invoice.currency}{" "}
                            {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              {invoice.payments &&
                Array.isArray(invoice.payments) &&
                invoice.payments.length > 0 && (
                  <div className="py-6 border-t border-border">
                    <PaymentHistory invoice={invoice} />
                  </div>
                )}

              {/* Totals */}
              <div className="pt-6 border-t border-border">
                <div className="max-w-xs ml-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Subtotal</span>
                      <span className="text-text">
                        {invoice.currency} {invoice.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {invoice.discount_total > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">Discount</span>
                        <span className="text-danger">
                          -{invoice.currency}{" "}
                          {invoice.discount_total.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.vat_rate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">
                          VAT ({invoice.vat_rate}%)
                        </span>
                        <span className="text-text">
                          {invoice.currency} {invoice.vat.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.nhil > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">
                          NHIL ({invoice.nhil}%)
                        </span>
                        <span className="text-text">
                          {invoice.currency} {invoice.nhil.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.getfund > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">
                          GETFund ({invoice.getfund}%)
                        </span>
                        <span className="text-text">
                          {invoice.currency} {invoice.getfund.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.covid_levy > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light">
                          COVID Levy ({invoice.covid_levy}%)
                        </span>
                        <span className="text-text">
                          {invoice.currency} {invoice.covid_levy.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t-2 border-border pt-2">
                      <span className="text-text">Total</span>
                      <span className="text-success">
                        {invoice.currency || "GHC"} {invoice.total.toFixed(2)}
                      </span>
                    </div>
                    {invoice.amount_paid > 0 && (
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-text-light">Amount Paid</span>
                        <span className="text-success">
                          -{invoice.currency} {invoice.amount_paid.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {invoice.remaining_balance > 0 && (
                      <div className="flex justify-between text-sm pt-1 border-t border-border">
                        <span className="text-text-light font-medium">
                          Remaining Balance
                        </span>
                        <span className="font-bold text-amber-600">
                          {invoice.currency}{" "}
                          {invoice.remaining_balance.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              {/* Credit Details */}
              {paymentMethod === "Credit" && (
                <>
                  {invoice.due_date && (
                    <div className="flex items-center gap-2 text-text-light">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Due:{" "}
                        {formatDate(
                          new Date(invoice.due_date),
                          DateFormatEnums.MEDIUM_DATE,
                        )}
                      </span>
                    </div>
                  )}
                  {invoice.terms && (
                    <div className="flex items-center gap-2 text-text-light">
                      <span>Terms: {invoice.terms}</span>
                    </div>
                  )}

                  {(invoice.notes || invoice.terms) && (
                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                      {invoice.notes && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2">
                            Notes
                          </h4>
                          <p className="text-sm text-text-light bg-gray-50 p-3 ">
                            {invoice.notes}
                          </p>
                        </div>
                      )}
                      {invoice.terms && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2">
                            Terms
                          </h4>
                          <p className="text-sm text-text-light bg-gray-50 p-3 ">
                            {invoice.terms}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-text-light">
                  <p>
                    {entity?.metadata?.footer_text ||
                      "Thank you for your business!"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span>Powered by Shine Tech Solutions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages - Hidden when printing */}
        <div className="mt-4 space-y-2 no-print">
          {isCancelled && (
            <div className="p-3 bg-danger-5 border border-danger  flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <p className="text-red-700">
                This invoice has been cancelled. No further actions can be
                taken.
              </p>
            </div>
          )}

          {isPaid && (
            <div className="p-3 bg-success-5 border border-success  flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-success">
                This invoice has been fully paid. Thank you!
              </p>
            </div>
          )}

          {invoice.payment_status === "overdue" && (
            <div className="p-3 bg-danger-5 border border-danger  flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <p className="text-danger">
                This invoice is overdue. Please remind the customer to make
                payment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
