import React, { useRef } from "react";
import { IOrder, IOrderItem } from "../../../core/interfaces/IOrder";
import { useModal } from "../../../core/hooks/useModal";
import { formatQuantity } from "../../../core/utils/formatQuantity";
import { DateFormatEnums, dateUtils } from "../../../core/utils/date-format";
import { Button } from "../../../ui";
import {
  ENTITY_KEY,
  getStoredItem,
} from "../../../core/hooks/useStore";
import { IEntityItem } from "../../../core/interfaces/IEntity";
import { downloadReceiptAsPDF, printReceiptDirectly } from "../../../core/utils/receipt";
import { toast } from "sonner";
// -------------------------------------------------------------------

/**
 * Format currency amount using US style (assuming USD/GHS for the sample).
 * @param {number} amount
 * @param {string} currencySymbol
 */
const formatCurrency = (amount: any, currencySymbol = "₵") => {
  return `${currencySymbol}${parseFloat(amount)?.toFixed(2)}`;
};

// Component representing the thermal receipt paper area
const ReceiptContainer: React.FC<{
  children: React.ReactNode;
  receiptRef: React.RefObject<HTMLDivElement | null>;
}> = ({ children, receiptRef }) => (
  <div
    ref={receiptRef}
    className="
      w-full max-w-[300px] p-4 bg-white shadow-sm border border-border 
      rounded-sm font-mono text-[11px] text-gray-800 break-words
      mx-auto print:p-2 print:shadow-none print:border-0
    "
  >
    {children}
  </div>
);

// Component for the Receipt Header
const ReceiptHeader: React.FC<{
  storeName: string;
  tagline: string;
  contact: string;
}> = ({ storeName, tagline, contact }) => (
  <header className="text-center mb-4">
    <h1 className="text-xl font-extrabold tracking-wider text-gray-900 uppercase mb-1">
      {storeName}
    </h1>
    <p className="text-xs text-gray-500 leading-tight">{contact}</p>
    <div className="w-full h-px bg-gray-200 my-3"></div>
  </header>
);

// Component for a dividing line
const Divider = () => (
  <div className="border-t border-dashed border-gray-400 my-2"></div>
);

/**
 * Format measurement details for display
 */
const formatMeasurementDetails = (item: IOrderItem): string => {
  const parts: string[] = [];

  if (item.content_measurement) {
    let measurementPart = item.content_measurement;

    if (item.content_unit && item.content_unit !== item.selling_unit) {
      measurementPart += `${item.content_unit}`;
    }
    parts.push(measurementPart);
  } else if (item.content_unit) {
    parts.push(item.content_unit);
  }

  if (item.selling_unit) {
    if (item.selling_unit_quantity) {
      parts.push(`${item.selling_unit_quantity}/${item.selling_unit}`);
    } else {
      parts.push(`/${item.selling_unit}`);
    }
  }

  return parts.join(" × ");
};

// Component for Item Row
const ItemRow: React.FC<{ item: IOrderItem }> = ({ item }) => {
  const itemTotal = item.unit_price * item.quantity;
  const measurementDetails = formatMeasurementDetails(item);

  return (
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1 pr-2">
        <div className="font-semibold text-gray-900 text-[11px]">
          {item.short_name}
        </div>
        {measurementDetails && (
          <div className="text-gray-500 text-[10px] mt-0.5">
            {`[${measurementDetails}]`}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-2 min-w-[120px]">
        <span className="text-gray-500 text-[11px] w-12 text-right">
          {`${formatCurrency(item.unit_price)}`}
        </span>
        <span className="text-gray-500 text-[11px] w-10 text-right">
          {`${formatQuantity(item.quantity)}`}
        </span>
        <span className="font-bold text-gray-900 text-[11px] w-12 text-right">
          {formatCurrency(itemTotal)}
        </span>
      </div>
    </div>
  );
};

// Component for Final Summary Row
const SummaryRow: React.FC<{
  label: string;
  value: string;
  isTotal?: boolean;
  color?: string;
}> = ({ label, value, isTotal = false, color = "text-gray-800" }) => (
  <div
    className={`flex justify-between ${
      isTotal ? "mt-2 pt-2 border-t border-dashed border-gray-300" : ""
    }`}
  >
    <span
      className={`text-left text-[11px] ${
        isTotal ? "font-bold" : "font-medium"
      } ${color}`}
    >
      {label}
    </span>
    <span
      className={`text-right text-[11px] ${
        isTotal ? "font-bold" : "font-medium"
      } ${color}`}
    >
      {value}
    </span>
  </div>
);

/**
 * Main Receipt Component combining all elements.
 */
const OrderReceiptContent: React.FC<{ order: IOrder }> = ({ order }) => {
  const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null)

  return (
    <>
      <ReceiptHeader
        storeName={entity?.name || "God-Did Mart"}
        tagline="Fresh finds and happy times!"
        contact={`${entity?.address} | ${entity?.phone_number}`}
      />

      {/* Transaction Details */}
      <section className="mb-3">
        <p className="font-bold text-xs text-center mb-2 text-gray-500">
          SALES RECEIPT
        </p>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Date/Time:</span>
            <span className="font-semibold">
              {dateUtils.formatDate(
                order.created_at,
                DateFormatEnums.DATE_TIME
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Order Code:</span>
            <span className="font-bold">{order.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Customer:</span>
            <span className="font-semibold">{order?.customer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cashier:</span>
            <span className="font-semibold">{order.cashier}</span>
          </div>
        </div>
      </section>

      <Divider />

      {/* Items Purchased */}
      <section className="mb-4">
        <div className="flex justify-between font-bold text-[10px] uppercase mb-1 text-gray-500 border-b border-gray-200 pb-1">
          <div className="flex-1">Item Name</div>
          <div className="flex items-center justify-end space-x-2 min-w-[120px]">
            <span className="w-12 text-right">Unit Price</span>
            <span className="w-10 text-right">Qty</span>
            <span className="w-12 text-right">Total</span>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {order.items.map((item, index) => (
            <ItemRow key={index} item={item} />
          ))}
        </div>
      </section>

      <Divider />

      {/* Financial Summary */}
      <section className="mb-3 space-y-1">
        <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
        <SummaryRow
          label="Discount"
          value={`-${formatCurrency(order.discount)}`}
          color="text-red-500"
        />
        <SummaryRow
          label="TOTAL"
          value={formatCurrency(order.total)}
          isTotal={true}
          color="text-black"
        />
      </section>

      <Divider />

      {/* Payment Summary */}
      <section className="text-center mb-4">
        <SummaryRow
          label="Amount Tendered"
          value={formatCurrency(order.tendered_cash)}
        />
        <SummaryRow
          label={order.balance_label}
          value={formatCurrency(order.balance)}
          color="text-black font-bold"
        />

        <p className="text-[11px] font-semibold mb-1 mt-2">Payment Method</p>
        <p className="text-xs font-bold text-green-600">
          {order.payment.payment_method.toUpperCase()}
        </p>
      </section>

      {/* Footer */}
      <footer className="text-center mt-4">
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">
          THANK YOU!
        </h3>
        <div className="mt-3">
          <img
            src={`https://barcode.tec-it.com/barcode.ashx?data=${order.code}&code=Code128&multiplebarcodes=false&unit=mm&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=mm&quiet=0`}
            alt="Order Barcode"
            className="mx-auto w-48 h-auto"
          />
        </div>
      </footer>
    </>
  );
};

// Main App component that renders the receipt and control buttons
const OrderReceipt = () => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { modalData, modalRef } = useModal();
  const orderData: IOrder = modalData?.order;
  const store = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);

 const handlePrint = () => {
    if (!orderData) return;
    
    const success = printReceiptDirectly(orderData, store!);
    
    if (success) {
      toast.success("Opening print preview...");
    } else {
      toast.error("Failed to open print window");
    }
  };

  const handleDownload = async () => {
    if (!orderData) return;
    
    toast.warning("Generating PDF...");
    const success = await downloadReceiptAsPDF(orderData, store!);
    
    if (success) {
      toast.success("Receipt downloaded successfully");
    } else {
      toast.error("Failed to generate PDF");
    }
  };


  return (
    <div className="h-full flex flex-col">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-container,
          .receipt-print-container * {
            visibility: visible;
          }
          .receipt-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 8px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Header and Action Buttons - Hidden during print */}
      <div className="no-print flex flex-col mb-6 border-b border-border sticky top-0 bg-white z-10">
        <div className="flex flex-row justify-between items-start mb-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-700">
              {modalData?.title}
            </h2>
            <h4 className="text-md text-gray-500 mt-1">
              {modalData?.subtitle}
            </h4>
          </div>
          <button
            onClick={() => modalRef!.dismiss()}
            className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center hover:bg-gray-100"
            aria-label="Close modal"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
      </div>

      {/* Receipt Container - This is what gets printed */}
      <div className="flex-1 overflow-y-auto flex justify-center items-start">
        <div className="receipt-print-container">
          <ReceiptContainer receiptRef={receiptRef}>
            {orderData ? (
              <OrderReceiptContent order={orderData} />
            ) : (
              <p className="text-center text-gray-500 py-8">
                Loading receipt data...
              </p>
            )}
          </ReceiptContainer>
        </div>
      </div>
      {/* Action Buttons (Download and Print) */}
      <div className="flex justify-between gap-3 pt-4 border-t border-border mt-auto">
        <div className="flex gap-x-3">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <i className="ri-download-2-line"></i>
            <span>Download PDF</span>
          </Button>
          <Button onClick={handlePrint} className="gap-2"  variant="outline" >
            <i className="ri-printer-line"></i>
            <span>Print Receipt</span>
          </Button>
        </div>

        <Button
          onClick={() => modalRef!.dismiss()}
          variant="primary" // Changed to primary for main close action
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default OrderReceipt;
