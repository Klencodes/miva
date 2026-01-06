// src/core/utils/receipt.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DateFormatEnums, dateUtils } from "./date-format";
import { IEntityItem } from "../interfaces/IEntity";
import { IOrder, IOrderItem } from "../interfaces/IOrder";

export const formatCurrency = (
  amount: number | string,
  isTotal: boolean = false
): string => {
  const num = parseFloat(amount?.toString() ?? "0") || 0;
  const symbol = isTotal ? "GH₵" : "₵";
  return `${symbol}${num.toFixed(2)}`;
};

// Matches your useOrderCalculations.getPricePerPiece
const getPricePerPiece = (item: IOrderItem): number => {
  if (item.price_per_piece !== undefined && item.price_per_piece > 0) {
    return item.price_per_piece;
  }
  const sellingQty = item.selling_unit_quantity || 1;
  return (item.unit_price || 0) / sellingQty;
};

// Critical: Must match your hook's subtotal logic exactly
export const calculateDisplayPrice = (item: IOrderItem): number => {
  const isPieceMode = item.isPieces === true || item.quantity_type === "pieces";

  if (isPieceMode) {
    return getPricePerPiece(item);
  } else {
    // Units mode: show price per unit/box
    return item.unit_price || getPricePerPiece(item) * (item.selling_unit_quantity || 1);
  }
};

export const calculateItemTotal = (item: IOrderItem): number => {
  const price = calculateDisplayPrice(item);
  return price * item.quantity;
};

// Quantity column: e.g., 2.5 for 2 boxes + 5 pieces
export const formatQuantityForColumn = (
  quantity: number,
  quantityType: string = "pieces",
  sellingUnitQuantity: number = 1
): string => {
  if (quantityType === "units") {
    return quantity.toFixed(0);
  }

  const full = Math.floor(quantity / sellingUnitQuantity);
  const rem = quantity % sellingUnitQuantity;

  if (full > 0 && rem > 0) {
    return `${full}.${rem}`;
  }
  return full > 0 ? full.toString() : quantity.toString();
};

// Measurement: e.g., 12X500ML
const formatMeasurementDetails = (item: IOrderItem): string => {
  const parts: string[] = [];
  if (item.selling_unit_quantity && item.selling_unit_quantity > 1) {
    parts.push(`${item.selling_unit_quantity}X`);
  }
  if (item.content_measurement) {
    parts.push(`${item.content_measurement}${item.content_unit || ""}`);
  }
  return parts.join("");
};

export const generateReceiptHTML = (
  order: IOrder,
  storeDetails: IEntityItem
): string => {
  return `
    <div class="receipt-container" style="width:290px;padding:0 10px 10px 10px;background:white;font-family:'Courier New',monospace;font-size:12px;color:#000;margin:0 auto;box-sizing:border-box;line-height:1.4;">
      <!-- Logo -->
      <div style="text-align:center;">
        <img src="/icons/logo-icon.png" alt="Logo" style="width:120px;height:80px;object-fit:contain;margin:0 auto 8px auto;display:block;" />
      </div>

      <!-- Header -->
      <div style="text-align:center;margin-bottom:15px;">
        <div style="font-size:18px;font-weight:900;text-transform:uppercase;">
          ${storeDetails?.name || "GODDID MART"}
        </div>
        <div style="font-size:10px;">
          ${storeDetails?.address || ""}<br/>
          TEL: ${storeDetails?.phone_number || ""}
        </div>
      </div>

      <div style="border-top:1px dashed #000;margin:10px 0;"></div>

      <!-- Transaction Info -->
      <div style="font-size:11px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;"><span>DATE:</span><span>${dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>RCPT#:</span><span style="font-weight:bold;">${order.code}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>CUST:</span><span>${(order.customer || "WALK-IN").toUpperCase()}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>CASHIER:</span><span>${(order.cashier || "STAFF").toUpperCase()}</span></div>
      </div>

      <div style="border-top:1px solid #000;margin:5px 0;"></div>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="border-bottom:1px solid #000;">
            <th style="text-align:left;padding:4px 0;">ITEM</th>
            <th style="text-align:right;padding:4px 0;">PRICE</th>
            <th style="text-align:right;padding:4px 0;">QTY</th>
            <th style="text-align:right;padding:4px 0;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map((item, index) => {
              const displayPrice = calculateDisplayPrice(item);
              const itemTotal = calculateItemTotal(item);
              const measurement = formatMeasurementDetails(item);
              const qtyColumn = formatQuantityForColumn(
                item.quantity,
                item.quantity_type || "pieces",
                item.selling_unit_quantity || 1
              );
              const isLast = index === order.items.length - 1;
              const border = isLast ? "" : 'border-bottom:1px dashed #ddd;';

              return `
                <tr>
                  <td colspan="4" style="padding:12px 0 4px 0;font-weight:bold;text-transform:uppercase;font-size:11px;">
                    ${item.short_name || item.product_name || "Unknown Item"}
                  </td>
                </tr>
                <tr style="${border}">
                  <td style="font-size:9px;color:#444;padding-bottom:8px;">${measurement || "&nbsp;"}</td>
                  <td style="text-align:right;padding-bottom:8px;">${formatCurrency(displayPrice)}</td>
                  <td style="text-align:right;font-weight:bold;padding-bottom:8px;">${qtyColumn}</td>
                  <td style="text-align:right;font-weight:bold;padding-bottom:8px;">${formatCurrency(itemTotal)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="font-size:12px;margin-top:10px;">
        ${order.discount > 0
          ? `<div style="display:flex;justify-content:space-between;"><span>DISCOUNT:</span><span>-${order.discount.toFixed(2)}</span></div>`
          : ""}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:15px;margin-top:5px;border-top:1px double #000;padding-top:5px;">
          <span>TOTAL:</span><span>${formatCurrency(order.total, true)}</span>
        </div>
      </div>

      <div style="border-top:1px dashed #000;margin:10px 0;"></div>

      <!-- Payment -->
      <div style="font-size:11px;">
        <div style="display:flex;justify-content:space-between;"><span>TENDERED:</span><span>${(order.tendered_cash || 0).toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>${(order.balance_label || "CHANGE").toUpperCase()}:</span>
          <span>${Math.abs(order.balance || 0).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;">
          <span>METHOD:</span><span>${(order.payment?.payment_method || "CASH").toUpperCase()}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:15px;border-top:1px solid #000;padding-top:10px;">
        <div style="font-weight:bold;font-size:13px;">THANK YOU!</div>
        <div style="font-size:9px;margin-top:8px;">Software by ShineTech</div>
      </div>
    </div>
  `;
};

export const printReceiptDirectly = (
  order: IOrder,
  storeDetails: IEntityItem
): boolean => {
  const receiptHtml = generateReceiptHTML(order, storeDetails);
  const printWin = window.open("", "_blank", "width=400,height=800");

  if (!printWin) {
    console.error("Print window blocked");
    return false;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${order.code}</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin:0; padding:8px; width:80mm; font-family:'Courier New',monospace; }
          }
          body { margin:0; padding:8px; width:80mm; font-family:'Courier New',monospace; font-size:11px; }
        </style>
      </head>
      <body>${receiptHtml}
        <script>
          setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 250);
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
  return true;
};

export const downloadReceiptAsPDF = async (
  order: IOrder,
  storeDetails: IEntityItem
): Promise<boolean> => {
  try {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = "-9999px";
    div.style.width = "80mm";
    div.style.padding = "8px";
    div.style.background = "white";
    div.style.fontFamily = "'Courier New', monospace";
    div.style.boxSizing = "border-box";
    div.innerHTML = generateReceiptHTML(order, storeDetails);
    document.body.appendChild(div);

    const canvas = await html2canvas(div, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(div);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", [imgWidth, imgHeight + 10]);
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`Receipt-${order.code}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    return false;
  }
};