import { useState } from "react";
import { Send, Mail, MessageSquare, Loader2 } from "lucide-react";
import { Button, Input } from "../../components/common";
import InvoiceService from "../../core/services/invoice";
import { toast } from "sonner";
import { useModal } from "../../core/hooks/useModal";



const SendInvoiceModal = () => {
    const { modalRef, modalData } = useModal()
  const { invoice } = modalData;
  const [email, setEmail] = useState(invoice.customer.email || "");
  const [message, setMessage] = useState(
    `Please find attached invoice ${invoice.number} for your records.`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error("Error", { description: "Please enter a recipient email" });
      return;
    }

    setSending(true);
    try {
      const response = await InvoiceService.send(invoice.uuid, email, message);

      if (response.success) {
        toast.success("Success", {
          description: `Invoice sent successfully to ${email}`,
        });
        // onSuccess?.(response.results);
        // onClose();
      }
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      toast.error("Error", {
        description: error.message || "Failed to send invoice",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-10 rounded-lg">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Send Invoice</h2>
          <p className="text-sm text-text-light">
            Invoice #{invoice.number} - {invoice.customer.name}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-text-light mb-1.5">
            Recipient Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium text-text-light mb-1.5">
            Message
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-text-light" />
            <Input
            type="textarea"
              value={message}
              onChange={(value: string) => setMessage(value)}
              placeholder="Add a message..."
              rows={4}
            />
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-border">
          <div className="flex justify-between text-sm">
            <span className="text-text-light">Invoice Number</span>
            <span className="font-medium text-text">{invoice.number}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-light">Total Amount</span>
            <span className="font-medium text-text">
              {invoice.currency || "GHS"} {invoice.total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-light">Customer</span>
            <span className="font-medium text-text">{invoice.customer.name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleSend}
            disabled={sending}
            className="flex-1"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Invoice
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={()=>modalRef?.close()}
            disabled={sending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;