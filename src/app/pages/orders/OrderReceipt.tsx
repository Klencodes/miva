import React, { useRef, useState } from "react";
import { IOrder, IOrderItem } from "../../../core/interfaces/IOrder";
import { useModal } from "../../../core/hooks/useModal";
import { formatQuantity } from "../../../core/utils/formatQuantity";
import { DateFormatEnums, dateUtils } from "../../../core/utils/date-format";

// --- REQUIRED LIBRARIES FOR PDF DOWNLOAD (You must install these) ---
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "../../../ui";
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
            w-full p-4 bg-white shadow-sm 
            border border-border rounded-sm font-mono 
            text-[11px] text-gray-800 break-words print:shadow-none print:border-0 print:p-0
            receipt-content
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
    {/* <div className="text-base mb-1 text-pink-500">
      <i className="ri-shopping-bag-line"></i>
    </div> */}
    <h1 className="text-xl font-extrabold tracking-wider text-gray-900 uppercase">
      {storeName}
    </h1>
    <p className="text-xs mt-1 text-gray-500">{contact}</p>
    <div className="w-full h-px bg-gray-200 my-4 pattern"></div>
  </header>
);

// Component for a dividing line
const Divider = () => (
  <div className="border-t border-dashed border-gray-900 my-3"></div>
);

/**
 * Format measurement details for display
 */
const formatMeasurementDetails = (item: IOrderItem): string => {
  const parts: string[] = [];

  if (item.content_measurement) {
    let measurementPart = item.content_measurement;

    if (item.content_unit && item.content_unit !== item.selling_unit) {
      measurementPart += ` ${item.content_unit}`;
    }
    parts.push(measurementPart);
  } else if (item.content_unit) {
    parts.push(item.content_unit);
  }

  if (item.selling_unit) {
    if (item.selling_unit_quantity) {
      parts.push(`${item.selling_unit_quantity} per ${item.selling_unit}`);
    } else {
      parts.push(`per ${item.selling_unit}`);
    }
  }

  return parts.join(" • ");
};

const formatQuantityWithUnit = (quantity: number, item: IOrderItem): string => {
  const baseQuantity = formatQuantity(quantity);

  if (item.selling_unit && item.selling_unit_quantity) {
    const totalUnits = quantity * item.selling_unit_quantity;
    const contentUnit = item.content_unit || "units";

    return `${baseQuantity} ${item.selling_unit} (${formatQuantity(
      totalUnits
    )} ${contentUnit})`;
  }

  if (item.content_unit) {
    return `${baseQuantity} ${item.content_unit}`;
  }

  return baseQuantity;
};
// Component for Item Row
const ItemRow: React.FC<{ item: IOrderItem }> = ({ item }) => {
  const itemTotal = item.unit_price * item.quantity;
  const measurementDetails = formatMeasurementDetails(item);
  const displayQuantity = formatQuantityWithUnit(item.quantity, item);

  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex flex-col text-left text-[11px] w-3/6">
        <span className="font-semibold text-gray-900 text-[11px]">
          {item.short_name}{" "}
          <span className="text-[11px] text-gray-500">
            {item.content_measurement}
          </span>
        </span>

        {/* Measurement details */}
        {displayQuantity && (
          <span className="text-[11px] text-gray-500 mb-1">
            {displayQuantity}
          </span>
        )}
      </div>

      {/* Unit Price */}
      <span className="w-1/6 text-left text-[11px] text-gray-500">{`${formatCurrency(
        item.unit_price
      )}/${item.selling_unit}`}</span>

      {/* Quantity */}
      <span className="w-1/6 text-right text-[11px] text-gray-500 text-[11px]">
        {`${formatQuantity(item.quantity)} ${item.selling_unit}`}
      </span>

      {/* Total */}
      <span className="w-1/6 text-right text-[11px] font-bold text-gray-900">
        {formatCurrency(itemTotal)}
      </span>
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
      isTotal ? "mt-3 pt-2 border-t border-dashed border-gray-400" : ""
    }`}
  >
    <span
      className={`text-left ${
        isTotal ? "text-[11px] font-bold" : "text-[11px] font-medium"
      } ${color}`}
    >
      {label}
    </span>
    <span
      className={`text-left ${
        isTotal ? "text-md font-bold" : "text-[11px] font-medium"
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
  return (
    <>
      <ReceiptHeader
        storeName="GOD-DID MART"
        tagline="Fresh finds and happy times!"
        contact="No 1 Junction St, Michel Camp - Tema | 055283923923"
      />

      {/* Transaction Details */}
      <section className="text-left mb-3 space-y-1 text-[11px]">
        <p className="font-bold text-sm text-center mb-3 text-gray-500">
          SALES RECEIPT
        </p>
        <div className="flex justify-between">
          <span className="text-gray-500 text-[11px]">Date/Time:</span>
          <span className="font-semibold text-[11px]">
            {dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 text-[11px]">Order Code:</span>
          <span className="font-bold text-[11px]">{order.code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Customer:</span>
          <span className="font-semibold">{order.customer}</span>
        </div>
        <div className="flex justify-between ">
          <span className="text-gray-500 text-[11px]">Cashier:</span>
          <span className="font-semibold text-[11px]">{order.cashier}</span>
        </div>
      </section>

      <Divider />

      {/* Items Purchased */}
      <section className="mb-5">
        <div className="flex justify-between font-bold text-[10px] uppercase mb-2 text-gray-500 border-b border-gray-200 pb-1">
          <span className="w-3/6 text-left">Item Name</span>
          <span className="w-1/6 text-left">Unit Price</span>
          <span className="w-1/6 text-right">Qty</span>
          <span className="w-1/6 text-right">Total</span>
        </div>
        {order.items.map((item, index) => (
          <ItemRow key={index} item={item} />
        ))}
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
          color="text-black font-bold mt-2"
        />

        <p className="text-[11px] font-semibold mb-1">Payment Method</p>
        <p className="text-md font-bold text-green-600 mb-4">
          {order.payment.payment_method.toUpperCase()}
        </p>

      
      </section>

      {/* Footer */}
      <footer className="text-center mt-6">
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">
          {" "}
          THANK YOU!
        </h3>

        <div className="text-2xl text-gray-400">
          {/* Placeholder for Barcode or QR Code */}
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

  /**
   * Handles the print action, leveraging browser's print dialogue
   * and print-specific CSS to isolate the 'receipt-content'.
   */
  const handlePrint = () => {
    // We don't need the 'printing' state/timeout here because the modal and buttons
    // are hidden using the 'no-print' class in the print CSS.
    window.print();
  };

  /**
   * Handles downloading the receipt as a PDF using html2canvas and jsPDF.
   * NOTE: html2canvas and jsPDF must be installed and imported.
   */
  const handleDownload = async () => {
    if (receiptRef.current && orderData) {
      try {
        await html2canvas(receiptRef.current, { scale: 3 }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const imgWidth = 80; // 80mm width for thermal paper
          const pageHeight = 295; // A4 height (max, used for initial setup)
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;

          // Use 'mm' unit for precise receipt size simulation
          const pdf = new jsPDF("p", "mm", [
            imgWidth,
            imgHeight > pageHeight ? imgHeight + 20 : pageHeight,
          ]);

          let position = 0;

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // Logic for multi-page PDF (if receipt is very long)
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`Receipt-${orderData.code}.pdf`);
        });
        console.log(
          "PDF Download initiated. Requires html2canvas and jsPDF libraries."
        );
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center">
      {/* Tailwind CSS print styling injection */}
      <style>{`
                /* Print styles optimized for narrow receipt paper */
                @media print {
                    @page {
                        size: 80mm auto; /* Typical thermal receipt width */
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background-color: transparent !important;
                    }
                
                    /* Class to hide everything except the receipt content */
                    body > :not(.receipt-content) {
                        display: none !important;
                    }

                    /* Ensure the receipt content is visible and fills the print area */
                    .receipt-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 80mm;
                        max-width: none;
                        box-shadow: none;
                        border: none;
                        padding: 10px;
                        margin: 0;
                    }
                }
            `}</style>

      <div className="h-full overflow-y-auto w-full">
        {/* Modal Header and Action Buttons */}
        <div className="flex flex-col mb-6 border-b border-border pb-4 sticky top-0 bg-card z-10 no-print">
          <div className="flex flex-row justify-between items-start mb-4">
            <div className="flex flex-col">
              <h2 className="text-2xl text-text font-bold">
                {modalData?.title}
              </h2>
              <h4 className="text-md text-text-light mt-1">
                {modalData?.subtitle}
              </h4>
            </div>
            <button
              onClick={() => modalRef!.dismiss()}
              className="w-8 h-8 rounded-full text-text-light transition-colors flex items-center justify-center"
              aria-label="Close modal"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Action Buttons (Download and Print) */}
          <div className="flex justify-start space-x-4">
            <Button onClick={handleDownload} variant="ghost">
              <i className="ri-download-2-line"></i>
              <span>Download Receipt (PDF)</span>
            </Button>
            <Button onClick={handlePrint}>
              <i className="ri-printer-line"></i>
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>

        {/* Order Details Content */}
        <div className="flex justify-center">
          {/* Receipt Display */}
          <ReceiptContainer receiptRef={receiptRef}>
            {orderData ? (
              <OrderReceiptContent order={orderData} />
            ) : (
              <p>Loading Order Data...</p>
            )}
          </ReceiptContainer>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
