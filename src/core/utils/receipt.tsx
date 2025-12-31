import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DateFormatEnums, dateUtils } from "../../core/utils/date-format";
import { IEntityItem } from "../interfaces/IEntity";
import { IOrder } from "../interfaces/IOrder";

export const formatCurrency = (amount: any, isTotal: boolean = false, currencySymbol = isTotal ? "GH₵" : "₵") => {
  return `${currencySymbol}${parseFloat(amount)?.toFixed(2)}`;
};

// Helper function to format quantity display based on quantity_type
export const formatQuantityDisplay = (
  quantity: number, 
  quantityType: string, 
  sellingUnitQuantity: number, 
  sellingUnit: string
): string => {
  if (quantityType === 'units') {
    // For units, just show number of boxes/units
    return `${quantity} ${sellingUnit}${quantity > 1 ? 's' : ''}`;
  } else {
    // For pieces, calculate boxes and pieces
    const fullUnits = Math.floor(quantity / sellingUnitQuantity);
    const remainingPieces = quantity % sellingUnitQuantity;
    
    if (fullUnits > 0 && remainingPieces > 0) {
      return `${fullUnits} ${sellingUnit}${fullUnits > 1 ? 's' : ''} ${remainingPieces} pc${remainingPieces > 1 ? 's' : ''}`;
    } else if (fullUnits > 0) {
      return `${fullUnits} ${sellingUnit}${fullUnits > 1 ? 's' : ''}`;
    } else {
      return `${quantity} pc${quantity > 1 ? 's' : ''}`;
    }
  }
};

// Helper function to format quantity for the quantity column
export const formatQuantityForColumn = (
  quantity: number, 
  quantityType: string, 
  sellingUnitQuantity: number
): string => {
  if (quantityType === 'units') {
    // For units, show the unit count directly
    return quantity.toString();
  } else {
    // For pieces, show as decimal if applicable
    const fullUnits = Math.floor(quantity / sellingUnitQuantity);
    const remainingPieces = quantity % sellingUnitQuantity;
    
    if (fullUnits > 0 && remainingPieces > 0) {
      return `${fullUnits}.${remainingPieces}`;
    } else if (fullUnits > 0) {
      return fullUnits.toString();
    } else {
      return quantity.toString();
    }
  }
};

// Calculate the correct price for display based on quantity_type
export const calculateDisplayPrice = (item: any): number => {
  if (item.quantity_type === 'units') {
    // For units, show the box/unit price (unit_price is the price per box)
    return item.unit_price || 0;
  } else {
    // For pieces, show price per piece
    return item.price_per_piece || item.unit_price_per_piece || 
           (item.unit_price / (item.selling_unit_quantity || 1));
  }
};

// Calculate the correct total for an item
export const calculateItemTotal = (item: any): number => {
  if (item.quantity_type === 'units') {
    // For units: unit_price × quantity (where quantity is number of boxes)
    return (item.unit_price || 0) * item.quantity;
  } else {
    // For pieces: price_per_piece × quantity (where quantity is number of pieces)
    const pricePerPiece = item.price_per_piece || item.unit_price_per_piece ||  (item.unit_price / (item.selling_unit_quantity || 1));
    return pricePerPiece * item.quantity;
  }
};
export const generateReceiptHTML2 = (
  order: IOrder,
  storeDetails: IEntityItem
) => {
  const formatMeasurementDetails = (item: any): string => {
    const parts: string[] = [];
    if (item.selling_unit_quantity > 1) parts.push(`${item.selling_unit_quantity}X`);
    if (item.content_measurement) parts.push(`${item.content_measurement}${item.content_unit || ""}`);
    return parts.join("");
  };

  return `
    <div class="receipt-container" style="
      width: 290px;
      padding: 10px;
      background: white;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      margin: 0 auto;
      box-sizing: border-box;
      line-height: 1.4;
    ">
      <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">
          ${storeDetails?.name || "GODDID MART"}
        </div>
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">
          ${storeDetails?.branch || "MAIN BRANCH"}
        </div>
        <div style="font-size: 10px;">
          ${storeDetails?.address || ""}<br/>
          TEL: ${storeDetails?.phone_number || ""}
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

      <div style="font-size: 11px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>DATE:</span>
          <span>${dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>RCPT#:</span>
          <span style="font-weight: bold;">${order.code}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>CUST:</span>
          <span>${(order.customer || "WALK-IN").toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>CASHIER:</span>
          <span>${(order.cashier || "STAFF").toUpperCase()}</span>
        </div>
      </div>

      <div style="border-top: 1px solid #000; margin: 5px 0;"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; padding: 4px 0;">ITEM</th>
            <th style="text-align: right; padding: 4px 0;">PRICE</th>
            <th style="text-align: center; padding: 4px 0;">QTY</th>
            <th style="text-align: right; padding: 4px 0;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item) => {
            const displayPrice = calculateDisplayPrice(item);
            const itemTotal = calculateItemTotal(item);
            const measurement = formatMeasurementDetails(item);
            const qtyColumn = formatQuantityForColumn(
              item.quantity,
              item.quantity_type || 'pieces',
              item.selling_unit_quantity || 1
            );
            
            return `
              <tr>
                <td colspan="4" style="padding-top: 8px; font-weight: bold; text-transform: uppercase;">
                  ${item.short_name || item.product_name}
                </td>
              </tr>
              <tr style="border-bottom: 1px dashed #eee;">
                <td style="font-size: 9px; color: #444; vertical-align: top;">
                  ${measurement}
                </td>
                <td style="text-align: right; vertical-align: top;">${displayPrice.toFixed(2)}</td>
                <td style="text-align: center; vertical-align: top;">${qtyColumn}</td>
                <td style="text-align: right; font-weight: bold; vertical-align: top;">${itemTotal.toFixed(2)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div style="border-top: 1px solid #000; margin: 10px 0 5px 0;"></div>

      <div style="font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>SUBTOTAL:</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        ${order.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>DISCOUNT:</span>
            <span>-${order.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; margin-top: 5px; border-top: 1px double #000; padding-top: 5px;">
          <span>TOTAL:</span>
          <span>GH₵ ${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

      <div style="font-size: 11px;">
        <div style="display: flex; justify-content: space-between;">
          <span>TENDERED:</span>
          <span>${order.tendered_cash.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>${(order.balance_label || "CHANGE").toUpperCase()}:</span>
          <span>${Math.abs(order.balance).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px;">
          <span>METHOD:</span>
          <span>${(order.payment?.payment_method || "CASH").toUpperCase()}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 25px; border-top: 1px solid #000; padding-top: 10px;">
        <div style="font-weight: bold; font-size: 13px;">THANK YOU FOR YOUR BUSINESS!</div>
        <div style="font-size: 10px; margin-top: 5px;">Items sold in good condition are not returnable.</div>
        <div style="margin-top: 10px; font-size: 9px;">Software by Goddid Systems</div>
      </div>
    </div>
  `;
};

export const generateReceiptHTML = (
  order: IOrder,
  storeDetails: IEntityItem
) => {
  const formatMeasurementDetails = (item: any): string => {
    const parts: string[] = [];
    if (item.selling_unit_quantity > 1) parts.push(`${item.selling_unit_quantity}X`);
    if (item.content_measurement) parts.push(`${item.content_measurement}${item.content_unit || ""}`);
    return parts.join("");
  };

  return `
    <div class="receipt-container" style="
      width: 290px;
      padding: 0px 10px 10px 10px;
      background: white;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      margin: 0 auto;
      box-sizing: border-box;
      line-height: 1.4;
    ">
      <!-- Logo -->
      <div style="text-align: center; ">
        <img 
          src="/icons/logo-icon.png" 
          alt="Store Logo" 
          style="
            width: 120px;
            height: 80px;
            object-fit: contain;
            display: block;
            margin: 0 auto 8px auto;
          "
        />
      </div>

      <!-- Store Header -->
      <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">
          ${storeDetails?.name || "GODDID MART"}
        </div>
      
        <div style="font-size: 10px;">
          ${storeDetails?.address || ""}<br/>
          TEL: ${storeDetails?.phone_number || ""}
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

      <div style="font-size: 11px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span>DATE:</span>
          <span>${dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>RCPT#:</span>
          <span style="font-weight: bold;">${order.code}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>CUST:</span>
          <span>${(order.customer || "WALK-IN").toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>CASHIER:</span>
          <span>${(order.cashier || "STAFF").toUpperCase()}</span>
        </div>
      </div>

      <div style="border-top: 1px solid #000; margin: 5px 0;"></div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="border-bottom: 1px solid #111111ff;">
            <th style="text-align: left; padding: 4px 0;">ITEM</th>
            <th style="text-align: right; padding: 4px 0;">PRICE</th>
            <th style="text-align: right; padding: 4px 0;">QTY</th>
            <th style="text-align: right; padding: 4px 0;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item, index) => {
            const displayPrice = calculateDisplayPrice(item);
            const itemTotal = calculateItemTotal(item);
            const measurement = formatMeasurementDetails(item);
            const qtyColumn = formatQuantityForColumn(
              item.quantity,
              item.quantity_type || 'pieces',
              item.selling_unit_quantity || 1
            );

            const isLastItem = index === order.items.length - 1;
            const borderStyle = isLastItem ? '' : 'border-bottom: 1px dashed #dedadaff;';

            return `
              <tr>
                <td colspan="4" style="padding-top: 12px; padding-bottom: 4px; font-weight: bold; text-transform: uppercase; font-size: 11px;">
                  ${item.short_name || item.product_name}
                </td>
              </tr>
              <tr style="${borderStyle}">
                <td style="font-size: 9px; color: #444; vertical-align: top; padding-bottom: 8px;">
                  ${measurement || '&nbsp;'}
                </td>
                <td style="text-align: right; vertical-align: top; padding-bottom: 8px;">
                  ${formatCurrency(displayPrice)}
                </td>
                <td style="text-align: right; vertical-align: top; padding-bottom: 8px; font-weight: bold;">
                  ${qtyColumn}
                </td>
                <td style="text-align: right; vertical-align: top; padding-bottom: 8px; font-weight: bold;">
                  ${formatCurrency(itemTotal)}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>

      <div style="font-size: 12px;">
        ${order.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>DISCOUNT:</span>
            <span>-${order.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; margin-top: 5px; border-top: 1px double #000; padding-top: 5px;">
          <span>TOTAL:</span>
          <span>GH₵ ${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

      <div style="font-size: 11px;">
        <div style="display: flex; justify-content: space-between;">
          <span>TENDERED:</span>
          <span>${order.tendered_cash.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>${(order.balance_label || "CHANGE").toUpperCase()}:</span>
          <span>${Math.abs(order.balance).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px;">
          <span>METHOD:</span>
          <span>${(order.payment?.payment_method || "CASH").toUpperCase()}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px;">
        <div style="font-weight: bold; font-size: 12px;">THANK YOU!</div>
        <div style="margin-top: 10px; font-size: 9px;">Software by ShineTech</div>
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
              font-family: 'Lucida Console', monospace !important;
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
              font-family: 'Lucida Console', monospace !important;
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
            font-family: 'Lucida Console', monospace;
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
            font-family: 'Lucida Console', monospace;
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
    tempContainer.style.width = "80mm";
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
      width: 300,
      height: tempContainer.scrollHeight,
    });

    // Remove temp container
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 80;
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