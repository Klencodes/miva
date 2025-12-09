import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { IOrder } from "../../core/interfaces/IOrder";
import { formatQuantity } from "../../core/utils/formatQuantity";
import { DateFormatEnums, dateUtils } from "../../core/utils/date-format";
import { IEntityItem } from "../interfaces/IEntity";

export const formatCurrency = (amount: any, currencySymbol = "₵") => {
  return `${currencySymbol}${parseFloat(amount)?.toFixed(2)}`;
};

export const generateReceiptHTML = (order: IOrder, storeDetails: IEntityItem) => {
  const formatMeasurementDetails = (item: any): string => {
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
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 16px;">
        <h1 style="font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #111827; margin-bottom: 4px;">
          ${storeDetails?.name || "God-Did Mart"}
        </h1>
        <p style="font-size: 11px; color: #6b7280; line-height: 1.2;">
          ${storeDetails?.address || ""} | ${storeDetails?.phone_number || ""}
        </p>
        <div style="width: 100%; height: 1px; background: #e5e7eb; margin: 12px 0;"></div>
      </div>

      <!-- Transaction Details -->
      <div style="margin-bottom: 12px;">
        <p style="font-weight: bold; font-size: 11px; text-align: center; margin-bottom: 8px; color: #6b7280;">
          SALES RECEIPT
        </p>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #6b7280;">Date/Time:</span>
          <span style="font-weight: 600;">${dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #6b7280;">Order Code:</span>
          <span style="font-weight: bold;">${order.code}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #6b7280;">Customer:</span>
          <span style="font-weight: 600;">${order.customer}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Cashier:</span>
          <span style="font-weight: 600;">${order.cashier}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #9ca3af; margin: 8px 0;"></div>

      <!-- Items -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
          <div style="flex: 1;">Item Name</div>
          <div style="display: flex; min-width: 120px;">
            <span style="width: 48px; text-align: right;">Unit Price</span>
            <span style="width: 40px; text-align: right; margin-left: 8px;">Qty</span>
            <span style="width: 48px; text-align: right; margin-left: 8px;">Total</span>
          </div>
        </div>
        
        ${order.items.map(item => {
          const measurementDetails = formatMeasurementDetails(item);
          const itemTotal = item.unit_price * item.quantity;
          
          return `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div style="flex: 1; padding-right: 8px;">
                <div style="font-weight: 600; color: #111827; font-size: 11px;">
                  ${item.short_name}
                </div>
                ${measurementDetails ? `
                  <div style="color: #6b7280; font-size: 10px; margin-top: 2px;">
                    [${measurementDetails}]
                  </div>
                ` : ''}
              </div>
              
              <div style="display: flex; align-items: center; justify-content: flex-end; min-width: 120px;">
                <span style="color: #6b7280; font-size: 11px; width: 48px; text-align: right;">
                  ${formatCurrency(item.unit_price)}/${item.selling_unit}
                </span>
                <span style="color: #6b7280; font-size: 11px; width: 40px; text-align: right; margin-left: 8px;">
                  ${formatQuantity(item.quantity)} ${item.selling_unit}
                </span>
                <span style="font-weight: bold; color: #111827; font-size: 11px; width: 48px; text-align: right; margin-left: 8px;">
                  ${formatCurrency(itemTotal)}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="border-top: 1px dashed #9ca3af; margin: 8px 0;"></div>

      <!-- Financial Summary -->
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="font-weight: 500; color: #374151;">Subtotal</span>
          <span style="font-weight: 500; color: #374151;">${formatCurrency(order.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="font-weight: 500; color: #dc2626;">Discount</span>
          <span style="font-weight: 500; color: #dc2626;">-${formatCurrency(order.discount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #d1d5db;">
          <span style="font-weight: bold; color: #000;">TOTAL</span>
          <span style="font-weight: bold; color: #000;">${formatCurrency(order.total)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #9ca3af; margin: 8px 0;"></div>

      <!-- Payment Summary -->
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="font-weight: 500;">Amount Tendered</span>
          <span style="font-weight: 500;">${formatCurrency(order.tendered_cash)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: bold; color: #000;">${order.balance_label}</span>
          <span style="font-weight: bold; color: #000;">${formatCurrency(order.balance)}</span>
        </div>
        
        <p style="font-size: 11px; font-weight: 600; margin-bottom: 4px; margin-top: 8px;">Payment Method</p>
        <p style="font-size: 12px; font-weight: bold; color: #059669;">
          ${order.payment.payment_method.toUpperCase()}
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 16px;">
        <h3 style="font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 8px;">
          THANK YOU!
        </h3>
        <div style="margin-top: 12px;">
          <img 
            src="https://barcode.tec-it.com/barcode.ashx?data=${order.code}&code=Code128&multiplebarcodes=false&unit=mm&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=mm&quiet=0" 
            alt="Order Barcode"
            style="margin: 0 auto; width: 192px; height: auto;"
          />
        </div>
      </div>
    </div>
  `;
};

export const printReceiptDirectly = (order: IOrder, storeDetails: IEntityItem) => {
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
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
          body {
            margin: 0;
            padding: 8px;
            font-family: monospace;
            font-size: 11px;
            background: white;
            width: 80mm;
            min-width: 80mm;
            max-width: 80mm;
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

export const downloadReceiptAsPDF = async (order: IOrder, storeDetails: IEntityItem) => {
  try {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '300px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.innerHTML = generateReceiptHTML(order, storeDetails);
    document.body.appendChild(tempContainer);

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    // Remove temp container
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 80; // 80mm width for thermal paper
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