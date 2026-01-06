// OrderReceipt.tsx
import React from "react";
import { IOrder } from "../../../core/interfaces/IOrder";
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../ui";
import { ENTITY_KEY, getStoredItem } from "../../../core/hooks/useStore";
import { IEntityItem } from "../../../core/interfaces/IEntity";
import { toast } from "sonner";

// Import the shared utilities
import {
  generateReceiptHTML,
  printReceiptDirectly,
  downloadReceiptAsPDF,
} from "../../../core/utils/receipt"; 

const OrderReceipt: React.FC = () => {
  const { modalData, modalRef } = useModal();
  const order: IOrder | undefined = modalData?.order;
  const store: IEntityItem | null = getStoredItem(ENTITY_KEY, null);

  const handlePrint = () => {
    if (!order || !store) {
      toast.error("Missing order or store data");
      return;
    }
    const success = printReceiptDirectly(order, store);
    if (success) {
      toast.success("Printing receipt...");
    } else {
      toast.error("Allow popups to print");
    }
  };

  const handleDownload = async () => {
    if (!order || !store) {
      toast.error("Missing order or store data");
      return;
    }
    toast.warning("Generating PDF...");
    const success = await downloadReceiptAsPDF(order, store);
    if (success) {
      toast.success("Receipt downloaded!");
    } else {
      toast.error("Failed to generate PDF");
    }
  };

  const receiptHtml = order && store ? generateReceiptHTML(order, store) : "<p>Loading...</p>";

  return (
    <div className="h-full flex flex-col">
      {/* Modal Header */}
      <div className="no-print flex flex-col mb-6 border-b border-border sticky top-0 bg-white z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-700">{modalData?.title}</h2>
            <h4 className="text-md text-gray-500 mt-1">{modalData?.subtitle}</h4>
          </div>
          <button
            onClick={() => modalRef!.dismiss()}
            className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-700 flex items-center justify-center hover:bg-gray-100"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
      </div>

      {/* Receipt Preview */}
      <div className="flex-1 overflow-y-auto flex justify-center py-6">
        <div
          className="bg-white shadow-lg border rounded-md max-w-[310px] w-full"
          dangerouslySetInnerHTML={{ __html: receiptHtml }}
        />
      </div>

      {/* Action Buttons */}
      <div className="no-print flex justify-between gap-3 pt-4 border-t border-border mt-auto">
        <div className="flex gap-3">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <i className="ri-download-2-line"></i> Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <i className="ri-printer-line"></i> Print Receipt
          </Button>
        </div>
        <Button onClick={() => modalRef!.dismiss()} variant="primary">
          Close
        </Button>
      </div>
    </div>
  );
};

export default OrderReceipt;