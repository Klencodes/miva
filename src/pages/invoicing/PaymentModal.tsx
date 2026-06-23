// components/invoices/PaymentModal.tsx
import { useState } from "react";
import { X, CreditCard, AlertCircle, Check } from "lucide-react";
import { Invoice, InvoicePayment } from "../../core/types";
import { Input, Button } from "../../components/common";
import { SelectOption } from "../../components/common/Input";
import { useModal } from "../../core/hooks/useModal";
import InvoiceService from "../../core/services/invoice";
import { toast } from "sonner";

const PaymentModal = () => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "MoMo" | "Bank" | "Credit"
  >("Cash");
  const [reference, setReference] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { modalData, modalRef } = useModal();
  const invoice = modalData?.invoice as Invoice;

  const remainingBalance = invoice?.total - (invoice?.amount_paid || 0);
  const isFullPayment = amount >= remainingBalance;

  const paymentMethodOptions: SelectOption[] = [
    { value: "Cash", label: "💵 Cash" },
    { value: "MoMo", label: "📱 Mobile Money" },
    { value: "Bank", label: "🏦 Bank Transfer" },
    { value: "Credit", label: "📋 Credit" },
  ];

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Validation Error", {
        description: "Please enter a valid payment amount",
      });
      return;
    }

    if (amount > remainingBalance) {
      toast.error("Validation Error", {
        description: `Payment amount cannot exceed the remaining balance of GHS ${remainingBalance.toFixed(2)}`,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const paymentData: InvoicePayment = {
        amount: amount,
        method: paymentMethod,
        reference: reference || undefined,
        date: new Date().toISOString(),
        bank_branch: bankBranch || undefined,
      };

      // Call API to add payment
      const response = await InvoiceService.addPayment(
        invoice.uuid,
        paymentData,
      );

      if (response.success) {
        toast.success("Success", {
          description: "Payment recorded successfully",
        });
        modalRef?.close({
          success: true,
          data: response.results?.invoice,
          payment: response.results?.payment,
        });
      } else {
        throw new Error(response.message || "Failed to record payment");
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error("Error", {
        description:
          error.message || "Failed to process payment. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    modalRef?.close({ success: false });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 flex justify-between items-center bg-card">
        <div>
          <h2 className="text-xl font-bold text-text">Make Payment</h2>
          <p className="text-sm text-text-light">
            Invoice #{invoice?.number} • {invoice?.customer?.name || "Customer"}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-light" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 px-6">
        {" "}
        {/* Balance Summary */}
        <div className="bg-background p-4 rounded-lg mb-6 border border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-light text-sm">
              Total Invoice Amount
            </span>
            <span className="font-semibold text-text">
              GHS {invoice?.total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-light text-sm">Amount Paid</span>
            <span className="font-semibold text-emerald-600">
              GHS {(invoice?.amount_paid || 0).toFixed(2)}
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
              label="Payment Amount (GHS)"
              labelType="default"
              placeholder={`Enter amount (max GHS ${remainingBalance.toFixed(2)})`}
              value={amount}
              onChange={(value: number) => setAmount(Math.max(0, value || 0))}
              max={remainingBalance}
              min={0}
              step={0.01}
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

          {/* Bank Name (for Bank transfers) */}
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

          {/* Reference (for MoMo, Bank) */}
          {(paymentMethod === "MoMo" || paymentMethod === "Bank") && (
            <div>
              <Input
                type="text"
                label="Reference / Transaction ID"
                labelType="default"
                placeholder="Transaction ID, check number, etc."
                value={reference}
                onChange={(value: string) => setReference(value)}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Input
              type="textarea"
              label="Notes (Optional)"
              labelType="default"
              placeholder="Add any notes about this payment..."
              value={bankBranch}
              onChange={(value: string) => setBankBranch(value)}
              rows={2}
            />
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="flex justify-end items-center p-4 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button onClick={handleClose} variant="ghost" className="flex-1">
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
