import React from "react";
import { Button } from "../../../ui";
import { useModal } from "../../../core/hooks/useModal";
import { DateFormatEnums, dateUtils } from "../../../core/utils/date-format";

// Import the Order interfaces defined earlier
import { IOrder, IOrderItem } from "../../../core/interfaces/IOrder"; 

interface OrderDetailsModalProps {
  order: IOrder; // Changed from payout to order
  title: string;
  subtitle: string;
}

export const OrderDetailsModal: React.FC = () => {
  const { modalRef, modalData } = useModal();

  
  // Adjusted destructuring to use 'order' instead of 'payout'
  const { order, title, subtitle } = modalData as OrderDetailsModalProps;

  // Since orders are generally immutable once created, there's no "status" logic 
  // like pending/successful/failed, but we can display the payment method status.
  const paymentMethod = order.payment.payment_method;
  
  // UPDATED: Accepts an amount number and uses a fixed currency (₵ based on your data)
  const formatCurrency = (amount: number, currency: string = "₵") => {
    if (amount === undefined || amount === null) return "N/A";
    
    let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return "N/A";
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  // Helper function to render a detail row
  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between">
      <span className="text-text-light">{label}:</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );

  const handleDownloadReceipt = () => {
    // Action to initiate receipt download (You would implement the logic here)
    modalRef!.close({ action: "download_receipt" });
  };

  const handlePrintReceipt = () => {
    // Action to initiate receipt download (You would implement the logic here)
    modalRef!.close({ action: "print_receipt" });
  };
  
  // Calculate total quantity of items
  // const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full w-full px-2">
      {/* Modal Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 bg-card z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">{title}</h2>
          <h4 className="text-md text-text-light mt-1">{subtitle}</h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Order Details Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Summary Block */}
        <div className="bg-primary-50 text-white rounded-lg p-4 flex justify-between items-center">
            <div>
                <p className="text-sm font-medium mb-1 opacity-80">Final Total</p>
                <div className="text-3xl font-bold">
                    {formatCurrency(order.total)}
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-medium">Order Code</div>
                <div className="text-lg font-bold">{order.code}</div>
            </div>
        </div>

        {/* Transaction, Customer, and Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Transaction & Customer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Order Information
            </h3>
            
            <div className="space-y-3">
              <DetailRow 
                label="Order Date" 
                value={dateUtils.formatDate(order.created_at, DateFormatEnums.DATE_TIME_SHORT)} 
              />
              <DetailRow label="Customer Name" value={order.customer} />
              <DetailRow label="Cashier ID" value={order.cashier} />
              {/* <DetailRow label="Location/Entity ID" value={order.entity_id} />
              <DetailRow label="Total Items" value={totalItemsCount} /> */}
            </div>
          </div>

          {/* Financial & Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Payment & Breakdown
            </h3>
            
            <div className="space-y-3">
              <DetailRow 
                label="Payment Method" 
                value={<span className="font-bold text-success">{paymentMethod}</span>}
              />
              <DetailRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              <DetailRow 
                label="Discount" 
                value={<span className="text-danger">-{formatCurrency(order.discount)}</span>}
              />
              <DetailRow label="Amount Tendered" value={formatCurrency(order.tendered_cash)} />
              <DetailRow label={order.balance_label} value={formatCurrency(order.balance)} />
            </div>
          </div>
        </div>
        
        {/* Order Items List */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Purchased Items ({order.items.length} unique products)
            </h3>
            <div className="overflow-x-auto bg-background">
                <table className="min-w-full">
                    <thead className="">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-text-light uppercase tracking-wider">Product</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-text-light uppercase tracking-wider">Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-text-light uppercase tracking-wider">Unit Price</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-text-light uppercase tracking-wider">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="border border-border">
                        {order.items.map((item: IOrderItem, index: number) => (
                            <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-text">
                                    {item.short_name}{" "} <span className="text-text-light">{item.selling_unit_quantity}x{item.content_measurement}{item.content_unit}/{item.selling_unit}</span>
                                    <div className="text-xs text-text-light">{item.category_name}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                  {item.quantity_type === "units" || item.quantity_type === item.selling_unit
                                    ? `${item.quantity} ${item.selling_unit}${item.quantity !== 1 ? "s" : ""}`
                                    : `${item.quantity} ${item.quantity_type || "piece"}${item.quantity !== 1 ? "s" : ""}`
                                  }                                
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                    {formatCurrency(item.unit_price)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-right">
                                    {formatCurrency(item.unit_price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t border-border mt-auto">
       <div className="flex gap-x-3">
         <Button
            onClick={handlePrintReceipt}
            variant="outline"
        >
            <i className="ri-printer-line mr-2"></i>
            Print Receipt
        </Button>
         <Button
            onClick={handleDownloadReceipt}
            variant="outline"
        >
            <i className="ri-download-line mr-2"></i>
            Download Receipt
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