import React, { useState, useCallback } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct } from "../../../core/interfaces/IProduct";
import { toast } from "sonner";

interface UpdateStockModalProps {
  data: {
    product: IProduct;
  };
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = () => {
  const { modalRef, modalData } = useModal();
  const product: IProduct = modalData.product;

  const [stock, setStock] = useState<string>(product.stock.toString());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = useCallback((value: string): string | null => {
    if (value === undefined || value === null || value.trim() === "") {
      return "Stock quantity is required.";
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return "Stock must be a non-negative number.";
    }
    return null;
  }, []);

  const handleChange = (value: string) => {
    setStock(value);
    setError(validate(value));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate(stock);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        product_id: product.id,
        stock: Number(stock),
      };

      // NOTE: Assuming appService.updateProductStock uses POST and sends product_id in the body as per previous discussion.
      const response = await appService.updateProductStock(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to update stock.");
      }

      toast.success("Stock Updated", {
        description: `${product.short_name} stock is now ${Number(stock).toFixed(2)} ${product.selling_unit}.`,
      });

      // Close the modal and return the updated product
      modalRef!.close({ success: true, product: response.results });
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Could not update product stock.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Main container uses flex-col and h-full
    <div className="flex flex-col h-full w-full px-2">
      {/* Header (Sticky at top of content/modal) */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-xl text-text font-bold">Update Stock Level</h2>
          <h4 className="text-md text-text-light mt-1">
            Product: <span className="font-medium text-text">{product.short_name}</span>
          </h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Form container uses flex-col and flex-1 to occupy remaining height */}
      <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
        
        {/* Scrollable Content Area: flex-1 ensures it takes all available vertical space, overflow-y-auto allows scrolling. */}
        <div className="flex-1 overflow-y-auto space-y-6 pt-4">
          <Input
            label={`New Stock Quantity (${product.selling_unit})`}
            type="number"
            step={0.01}
            placeholder="0.00"
            required
            name="stock"
            id="stock"
            value={stock}
            onChange={handleChange}
            error={error || undefined}
            min={0}
            hint={`Current Stock: ${product.stock.toFixed(2)} ${product.selling_unit}`}
          />
        </div>

        {/* Footer Buttons: pt-4 border-t border-border mt-auto ensures separation and anchors it to the bottom */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-auto">
          <Button
            variant="outline"
            type="button"
            onClick={() => modalRef!.dismiss()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !!error || stock.trim() === ""}
            loading={loading}
            icon="truck-line"
          >
            Update Stock
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateStockModal;