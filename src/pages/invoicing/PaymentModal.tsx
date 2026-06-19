// components/invoices/PaymentModal.tsx
import React, { useState, useMemo } from "react";
import { X, CreditCard, AlertCircle, Check } from "lucide-react";
import { Invoice, Payment } from "../../core/types";
import { Input, Button } from "../../components/common";
import { SelectOption } from "../../components/common/Input";
import { useModal } from "../../core/hooks/useModal";

const PaymentModal = () => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "MoMo" | "Bank" | "Credit"
  >("Cash");
  const [reference, setReference] = useState("");
  const [bankName, setBankName] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { modalData, modalRef } = useModal();
  const invoice = modalData?.invoice as Invoice;
  const remainingBalance = invoice?.total - invoice?.amountPaid;
  const isFullPayment = amount >= remainingBalance;

  const paymentMethodOptions: SelectOption[] = [
    { value: "Cash", label: "💵 Cash" },
    { value: "MoMo", label: "📱 Mobile Money" },
    { value: "Bank", label: "🏦 Bank Transfer" },
    { value: "Credit", label: "📋 Credit" },
  ];

  const handleSubmit = async () => {
    if (amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (amount > remainingBalance) {
      alert(
        `Payment amount cannot exceed the remaining balance of GHS ${remainingBalance.toFixed(2)}`,
      );
      return;
    }

    setIsProcessing(true);
    try {
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        invoiceId: invoice.id,
        amount: amount,
        method: paymentMethod,
        reference: reference || undefined,
        date: new Date(),
        notes: notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      handlePaymentComplete(payment);
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (payment: Payment) => {
    if (!invoice) return;

    // Calculate new totals
    const newAmountPaid = invoice.amountPaid + payment.amount;
    const newRemainingBalance = invoice.total - newAmountPaid;
    const newPaymentStatus = newRemainingBalance <= 0 ? "Paid" : "Partial";

    // Update invoice with new payment
    const updatedInvoice: Invoice = {
      ...invoice,
      amountPaid: newAmountPaid,
      remainingBalance: newRemainingBalance,
      paymentStatus: newPaymentStatus,
      payments: [...(invoice.payments || []), payment],
      updatedAt: new Date(),
    };

    // Update in localStorage
    try {
      const storedInvoices = localStorage.getItem("INVOICES");
      if (storedInvoices) {
        const invoices = JSON.parse(storedInvoices);
        const index = invoices.findIndex((inv: any) => inv.id === invoice.id);
        if (index !== -1) {
          invoices[index] = updatedInvoice;
          localStorage.setItem("INVOICES", JSON.stringify(invoices));
        }
      }
    } catch (error) {
      console.error("Error saving payment:", error);
    } finally {
      modalRef?.close({ success: true, data: updatedInvoice });
    }

    console.log("Payment recorded successfully:", payment);
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      {" "}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-text">Make Payment</h2>
          <p className="text-sm text-text-light">
            Invoice #{invoice.number} • {invoice.customer}
          </p>
        </div>
        <button
          onClick={() => modalRef?.close()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-light" />
        </button>
      </div>
      {/* Balance Summary */}
      <div className="bg-background p-4 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-light text-sm">Total Invoice Amount</span>
          <span className="font-semibold text-text">
            GHS {invoice.total.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-light text-sm">Amount Paid</span>
          <span className="font-semibold text-emerald-600">
            GHS {invoice.amountPaid.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-text-light text-sm font-medium">
            Remaining Balance
          </span>
          <span className="font-bold text-lg text-amber-600">
            GHS {remainingBalance.toFixed(2)}
          </span>
        </div>
      </div>
      {/* Payment Form */}
      <div className="space-y-4">
        {/* Amount */}
        <div>
          <Input
            label="Payment Amount"
            labelType="default"
            placeholder={`Enter amount (max GHS ${remainingBalance.toFixed(2)})`}
            value={amount}
            onChange={(value: number) => setAmount(Math.max(0, value || 0))}
            max={remainingBalance}
          />
          {amount > 0 && (
            <div className="mt-2 text-sm">
              {isFullPayment ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  This will complete the payment
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Remaining after payment: GHS{" "}
                  {(remainingBalance - amount).toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <Input
            type="select"
            label="Payment Method"
            labelType="default"
            value={paymentMethod}
            onChange={(value: any) => setPaymentMethod(value)}
            selectOptions={paymentMethodOptions}
          />
        </div>

        {/* Reference (optional) */}
        {paymentMethod === "Bank" && (
          <div>
            <Input
              type="text"
              label="Bank Name"
              labelType="default"
              placeholder="Bank Name & Branch"
              value={bankName}
              onChange={(value: string) => setBankName(value)}
            />
          </div>
        )}
        {(paymentMethod === "MoMo" || paymentMethod === "Bank") && (
          <div>
            <Input
              type="text"
              label="Reference"
              labelType="default"
              placeholder="Transaction ID, check number, etc."
              value={reference}
              onChange={(value: string) => setReference(value)}
            />
          </div>
        )}

        {/* Notes (optional) */}
        <div>
          <Input
            type="textarea"
            label="Notes (Optional)"
            labelType="default"
            placeholder="Add any notes about this payment..."
            value={notes}
            onChange={(value: string) => setNotes(value)}
            rows={2}
          />
        </div>
      </div>
      {/* Actions - Fixed at bottom */}
      <div className="flex gap-3 pt-4 mt-6 border-t border-border">
        <Button
          onClick={() => modalRef?.close()}
          variant="ghost"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || amount <= 0 || amount > remainingBalance}
          className="flex-1"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-border border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              {isFullPayment ? "Complete Payment" : "Record Payment"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentModal;
