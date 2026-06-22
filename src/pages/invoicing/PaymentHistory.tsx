import React, { useState } from 'react';
import { Invoice } from '../../core/types';
import { formatDate, DateFormatEnums } from '../../core/utils/date-format';
import {  ChevronDown, ChevronUp, Receipt, Check, AlertCircle } from 'lucide-react';

interface PaymentHistoryProps {
  invoice: Invoice;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  invoice, 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const payments = invoice.payments || [];
  const totalPaid = invoice.amount_paid || 0;
  const remainingBalance = invoice.total - totalPaid;
  const isFullyPaid = remainingBalance <= 0;

  const getPaymentStatusDisplay = () => {
    if (isFullyPaid) {
      return {
        label: 'Fully Paid',
        color: 'bg-emerald-100 text-emerald-700',
        icon: Check,
      };
    } else if (totalPaid > 0) {
      return {
        label: 'Partially Paid',
        color: 'bg-amber-100 text-amber-700',
        icon: Receipt,
      };
    } else {
      return {
        label: 'Unpaid',
        color: 'bg-red-100 text-red-700',
        icon: AlertCircle,
      };
    }
  };

  const status = getPaymentStatusDisplay();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-background transition-colors flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text">Payment History</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} flex items-center gap-1.5`}>
            {status.label}
          </div>
          <div className="flex items-center gap-4 text-sm text-text-light flex-wrap">
            <span>Paid: <span className="font-semibold text-emerald-600">GHS {totalPaid.toFixed(2)}</span></span>
            <span>Balance: <span className={`font-semibold ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
              GHS {remainingBalance.toFixed(2)}
            </span></span>
          </div>
        </div>
        <div className="text-text-light">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-text-light">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payments have been recorded for this invoice yet.</p>
              <p className="text-sm mt-1">Use the "Make Payment" button to record a payment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Method</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Branch</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Reference</th>
                    {/* <th className="px-4 py-3 text-center text-sm font-medium text-text-light">Action</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment, index) => (
                    <tr key={payment.payment_id || index} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3 text-sm text-text">
                        {formatDate(payment.date, DateFormatEnums.DATE_TIME_SHORT)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* {getPaymentMethodIcon(payment.method)} */}
                          <span className="text-sm text-text">{payment.method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light max-w-[150px] truncate">
                        {payment.bank_branch || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                        {invoice?.currency} {payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light">
                        {payment.reference || '-'}
                      </td>
                      
                      {/* <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeletePayment(payment.payment_id || `payment-${index}`)}
                          disabled={deletingPaymentId === payment.payment_id}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete payment"
                        >
                          {deletingPaymentId === payment.payment_id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;