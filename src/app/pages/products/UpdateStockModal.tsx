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

  // Calculate total pieces
  const totalPieces = product.selling_unit_quantity * Number(stock);

  return (
    <div className="flex flex-col h-full w-full px-2">
      {/* Header */}
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

      {/* Form */}
      <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pt-4">
          <div className="space-y-4">
            <Input
              label={`New Stock Quantity (${product.selling_unit})`}
              type="number"
              step={1}
              placeholder="0"
              required
              name="stock"
              id="stock"
              value={stock}
              onChange={handleChange}
              error={error || undefined}
              min={0}
              hint={`Current Stock: ${product.stock.toFixed(2)} ${product.selling_unit}`}
            />

            {/* Stock Summary */}
            <div className="bg-info-5 border border-info-20 rounded-sm p-3">
              <div className="flex items-center">
                <i className="ri-calculator-line text-info text-lg mr-2"></i>
                <div>
                  <p className="text-sm font-medium text-info mb-1">Stock Summary</p>
                  <p className="text-sm text-info">
                    {stock} {product.selling_unit} × {product.selling_unit_quantity} pieces = {totalPieces} total pieces
                  </p>
                  <p className="text-xs text-text-light mt-1">
                    Each {product.selling_unit} contains {product.selling_unit_quantity} pieces
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
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
          >
            Update Stock
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateStockModal;