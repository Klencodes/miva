import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { IOrder } from "../../core/interfaces/IOrder";
import { DateFormatEnums, dateUtils } from "../../core/utils/date-format";
import { IEntityItem } from "../interfaces/IEntity";

// Helper function to format quantity as fraction (e.g., 1.5 -> 1½)
export const formatQuantityAsFraction = (quantity: number): string => {
  const whole = Math.floor(quantity);
  const decimal = quantity - whole;
  
  if (decimal === 0) {
    return whole.toString();
  }
  
  // Convert common decimals to fractions
  if (decimal === 0.5) {
    return whole > 0 ? `${whole}½` : "½";
  }
  if (decimal === 0.25) {
    return whole > 0 ? `${whole}¼` : "¼";
  }
  if (decimal === 0.75) {
    return whole > 0 ? `${whole}¾` : "¾";
  }
  if (decimal === 0.33) {
    return whole > 0 ? `${whole}⅓` : "⅓";
  }
  if (decimal === 0.67) {
    return whole > 0 ? `${whole}⅔` : "⅔";
  }
  
  // For other decimals, show as decimal with 1 decimal place
  return quantity.toFixed(1);
};

// 1. Change Currency to GHS (Standard ASCII) to avoid '?'
export const formatCurrency = (amount: any, isTotal: boolean = false, currencySymbol = isTotal ? "GHS " : "") => {
  return `${currencySymbol}${parseFloat(amount)?.toFixed(2)}`;
};

// 2. Updated HTML Generator using Tables for Layout stability
export const generateReceiptHTML = (order: IOrder, storeDetails: IEntityItem) => {
    // Helper function to format measurement details like the PDF
  const formatMeasurementDetails = (item: any): string => {
    const parts: string[] = [];
    
    // For the PDF example: [40x75g/box]
    if (item.selling_unit_quantity) {
      parts.push(`${item.selling_unit_quantity}x`);
    }
    
    // Add content measurement and unit
    if (item.content_measurement && item.content_unit) {
      parts.push(`${item.content_measurement}${item.content_unit}`);
    } else if (item.content_measurement) {
      parts.push(item.content_measurement);
    } else if (item.content_unit) {
      parts.push(item.content_unit);
    }
    
    // Add selling unit with slash
    if (item.selling_unit) {
      return `${parts.join("")}/${item.selling_unit}`;
    }
    
    return parts.join("");
  };

  return `
    <div class="receipt-container" style="
      width: 72mm; /* Standard printable width for 80mm paper */
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.2;
      color: #000;
    ">
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 16px; font-weight: bold; text-transform: uppercase;">
          ${storeDetails?.name || "GODDID MART"}
        </div>
        <div>${storeDetails?.branch || ""}</div>
        <div style="font-size: 10px;">
          ${storeDetails?.address || ""}<br>
          Tel: ${storeDetails?.phone_number || ""}
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <div style="font-weight: bold;">SALES RECEIPT</div>
      </div>

      <table style="width: 100%; font-size: 11px; margin-bottom: 10px;">
        <tr><td>Date:</td><td style="text-align: right;">${dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME)}</td></tr>
        <tr><td>Order:</td><td style="text-align: right;">${order.code}</td></tr>
        <tr><td>Cashier:</td><td style="text-align: right;">${order.cashier || "Staff"}</td></tr>
      </table>

      <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; width: 40%;">ITEM</th>
            <th style="text-align: right; width: 25%;">PRICE</th>
            <th style="text-align: center; width: 10%;">QTY</th>
            <th style="text-align: right; width: 25%;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => `
            <tr>
              <td style="padding-top: 5px; vertical-align: top;">
                <div style="font-weight: bold;">${item.short_name}</div>
                <div style="font-size: 9px;">[${formatMeasurementDetails(item)}]</div>
              </td>
              <td style="text-align: right; vertical-align: top; padding-top: 5px;">${item.unit_price.toFixed(2)}</td>
              <td style="text-align: center; vertical-align: top; padding-top: 5px;">${item.quantity}</td>
              <td style="text-align: right; vertical-align: top; padding-top: 5px;">${(item.unit_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>

      <table style="width: 100%; font-size: 12px; font-weight: bold;">
        <tr><td>SUBTOTAL</td><td style="text-align: right;">${formatCurrency(order.subtotal, true)}</td></tr>
        <tr><td>DISCOUNT</td><td style="text-align: right;">-${formatCurrency(order.discount, true)}</td></tr>
        <tr style="font-size: 14px;">
          <td style="padding-top: 5px;">TOTAL</td>
          <td style="text-align: right; padding-top: 5px;">${formatCurrency(order.total, true)}</td>
        </tr>
      </table>

      <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>

      <table style="width: 100%; font-size: 11px;">
        <tr><td>Tendered:</td><td style="text-align: right;">${formatCurrency(order.tendered_cash, true)}</td></tr>
        <tr><td>Change:</td><td style="text-align: right;">${formatCurrency(order.balance || (order.tendered_cash - order.total), true)}</td></tr>
        <tr><td>Method:</td><td style="text-align: right;">${order.payment?.payment_method?.toUpperCase() || "CASH"}</td></tr>
      </table>

      <div style="text-align: center; margin-top: 20px; font-weight: bold;">
        THANK YOU!
      </div>
    </div>
  `;
};

export const printReceiptDirectly = (
  order: IOrder,
  storeDetails: IEntityItem
) => {
  const receiptHtml = generateReceiptHTML(order, storeDetails);

  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    console.error("Failed to open print window");
    return false;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${order.code}</title>
        <meta charset="utf-8">
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
              padding: 0;
            }
            body {
              margin: 0 !important;
              padding: 8px !important;
              width: 80mm !important;
              min-width: 80mm !important;
              max-width: 80mm !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: white !important;
              font-family: 'Courier New', monospace !important;
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
              font-family: 'Courier New', monospace !important;
            }
            .receipt-container {
              width: 100% !important;
              max-width: 100% !important;
              padding: 8px !important;
              box-sizing: border-box !important;
            }
          }
          body {
            margin: 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            background: white;
            width: 80mm;
            min-width: 80mm;
            max-width: 80mm;
            box-sizing: border-box;
          }
          .receipt-container {
            width: 100%;
            max-width: 100%;
            padding: 8px;
            background: white;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #000;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        ${receiptHtml}
        <script>
          // Auto-print and close
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              window.close();
            }, 500);
          }, 100);
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  return true;
};

export const downloadReceiptAsPDF = async (
  order: IOrder,
  storeDetails: IEntityItem
) => {
  try {
    // Create a temporary container
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.width = "80mm"; // Match receipt width
    tempContainer.style.backgroundColor = "white";
    tempContainer.style.fontFamily = "'Courier New', monospace";
    tempContainer.style.fontSize = "11px";
    tempContainer.style.boxSizing = "border-box";
    tempContainer.innerHTML = generateReceiptHTML(order, storeDetails);
    document.body.appendChild(tempContainer);

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: 300, // 80mm ≈ 300px
      height: tempContainer.scrollHeight,
    });

    // Remove temp container
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 80; // 80mm width for receipt
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [imgWidth, imgHeight + 10],
    });

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`Receipt-${order.code}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};