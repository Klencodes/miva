import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { IOrder } from "../../core/interfaces/IOrder";
import { DateFormatEnums, dateUtils } from "../../core/utils/date-format";
import { IEntityItem } from "../interfaces/IEntity";

export const formatCurrency = (amount: any, isTotal: boolean = false, currencySymbol = isTotal ? "GH₵" : "₵") => {
  return `${currencySymbol}${parseFloat(amount)?.toFixed(2)}`;
};

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

export const generateReceiptHTML = (
  order: IOrder,
  storeDetails: IEntityItem
) => {
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
      width: 100%;
      max-width: 300px;
      padding: 16px;
      background: white;
      font-family: monospace;
      font-size: 11px;
      color: #1f2937;
      word-break: break-word;
      margin: 0 auto;
      box-sizing: border-box;
    ">
      <!-- Header - Exactly like PDF -->
      <div style="text-align: center; margin-bottom: 16px;">
        <h1 style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 2px; letter-spacing: 0.5px;">
          ${storeDetails?.name || "GODDID MART"} – ${storeDetails?.branch }
        </h1>
        <p style="font-size: 10px; color: #000; line-height: 1.2; margin: 0;">
          ${storeDetails?.address || "Main St 001, No1 Junction – Michel Camp"} | ${storeDetails?.phone_number || "233538828589"}
        </p>
        <div style="width: 100%; height: 1px; background: #000; margin: 8px 0 12px 0;"></div>
      </div>

      <!-- SALES RECEIPT Title -->
      <p style="font-weight: bold; font-size: 12px; text-align: center; margin: 0 0 12px 0; color: #000;">
        SALES RECEIPT
      </p>

      <!-- Transaction Details -->
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #000;">Date/Time:</span>
          <span style="font-weight: 600;">${dateUtils.formatDate(
            order.created_at,
            DateFormatEnums.DATE_TIME
          )}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #000;">Order Code:</span>
          <span style="font-weight: bold;">${order.code}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #000;">Customer:</span>
          <span style="font-weight: 600;">${order.customer || "Walk-in Customer"}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #000;">Cashier:</span>
          <span style="font-weight: 600;">${order.cashier || "Joshua S"}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

      <!-- Items Header -->
      <div style="margin-bottom: 8px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 0.5fr 1fr; font-weight: bold; font-size: 10px; margin-bottom: 8px; color: #000; padding-bottom: 4px;">
          <span>ITEM NAME</span>
          <span style="text-align: right;">UNIT PRICE</span>
          <span style="text-align: center;">QTY</span>
          <span style="text-align: right;">TOTAL</span>
        </div>
        
        ${order.items
          .map((item) => {
            const measurementDetails = formatMeasurementDetails(item);
            const itemTotal = item.unit_price * item.quantity;
            const formattedQty = formatQuantityAsFraction(item.quantity);

            return `
            <div style="margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: 2fr 1fr 0.5fr 1fr; align-items: start; margin-bottom: 4px;">
                <!-- Item Name -->
                <div style="padding-right: 4px;">
                  <div style="font-weight: bold; color: #000; font-size: 11px;">
                    ${item.short_name}
                  </div>
                  ${
                    measurementDetails
                      ? `
                    <div style="color: #000; font-size: 9px; margin-top: 1px;">
                      [${measurementDetails}]
                    </div>
                  `
                      : ""
                  }
                </div>
                
                <!-- Unit Price -->
                <div style="text-align: right; font-weight: 600; font-size: 11px; padding-right: 4px;">
                  ${formatCurrency(item.unit_price)}
                </div>
                
                <!-- Quantity -->
                <div style="text-align: center; color: #000; font-size: 11px;">
                  ${formattedQty}
                </div>
                
                <!-- Total -->
                <div style="text-align: right; font-weight: bold; color: #000; font-size: 11px;">
                  ${formatCurrency(itemTotal)}
                </div>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

      <!-- Financial Summary -->
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 500; color: #000;">Subtotal</span>
          <span style="font-weight: 500; color: #000;">${formatCurrency(
            order.subtotal, true
          )}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 500; color: #000;">Discount</span>
          <span style="font-weight: 500; color: #000;">-${formatCurrency(
            order.discount, true
          )}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #000;">
          <span style="font-weight: bold; font-size: 12px; color: #000;">TOTAL</span>
          <span style="font-weight: bold; font-size: 12px; color: #000;">${formatCurrency(
            order.total, true
          )}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

      <!-- Payment Summary -->
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 500; color: #000;">Amount Tendered</span>
          <span style="font-weight: 500; color: #000;">${formatCurrency(
            order.tendered_cash, true
          )}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-weight: bold; font-size: 12px; color: #000;">Change</span>
          <span style="font-weight: bold; font-size: 12px; color: #000;">${formatCurrency(
            order.balance || (order.tendered_cash - order.total), true
          )}</span>
        </div>
         <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: bold; color: #000;">Payment Method</span>
          <span style="font-weight: 500; color: #000;">${order.payment?.payment_method?.toUpperCase() || "MOBILE MONEY"}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 16px;">
        <h3 style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 8px;">
          THANK YOU!
        </h3>
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