import React, { useState, useCallback } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct } from "../../../core/interfaces/IProduct";
import { toast } from "sonner";

interface UpdatePriceModalProps {
  data: {
    product: IProduct;
  };
}

const UpdatePriceModal: React.FC<UpdatePriceModalProps> = () => {
  const { modalRef, modalData } = useModal();
  const product: IProduct = modalData.product;

  const [pricePerUnit, setPricePerUnit] = useState<string>(product.price_per_unit?.toString() || "");
  const [pricePerPiece, setPricePerPiece] = useState<string>(product.price_per_piece?.toString() || "");
  const [errors, setErrors] = useState<{pricePerUnit?: string; pricePerPiece?: string}>({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: {pricePerUnit?: string; pricePerPiece?: string} = {};
    
    // Validate price per unit
    if (!pricePerUnit || pricePerUnit.trim() === "") {
      newErrors.pricePerUnit = "Price per unit is required.";
    } else {
      const num = Number(pricePerUnit);
      if (isNaN(num) || num < 0) {
        newErrors.pricePerUnit = "Price per unit must be a non-negative number.";
      }
    }

    // Validate price per piece
    if (!pricePerPiece || pricePerPiece.trim() === "") {
      newErrors.pricePerPiece = "Price per piece is required.";
    } else {
      const num = Number(pricePerPiece);
      if (isNaN(num) || num < 0) {
        newErrors.pricePerPiece = "Price per piece must be a non-negative number.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [pricePerUnit, pricePerPiece]);

  const handlePricePerUnitChange = (value: string) => {
    setPricePerUnit(value);
    // Clear error for this field when user starts typing
    if (errors.pricePerUnit) {
      setErrors(prev => ({ ...prev, pricePerUnit: undefined }));
    }
  };

  const handlePricePerPieceChange = (value: string) => {
    setPricePerPiece(value);
    // Clear error for this field when user starts typing
    if (errors.pricePerPiece) {
      setErrors(prev => ({ ...prev, pricePerPiece: undefined }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        product_id: product.id,
        price_per_unit: Number(pricePerUnit),
        price_per_piece: Number(pricePerPiece),
      };

      const response = await appService.updateProductPrice(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to update prices.");
      }

      toast.success("Prices Updated", {
        description: `${product.short_name} prices updated successfully.`,
      });

      // Close the modal and return the updated product
      modalRef!.close({ success: true, product: response.results });
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Could not update product prices.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate the ratio to show if prices are consistent
  const calculateRatio = () => {
    const unitPrice = Number(pricePerUnit) || 0;
    const piecePrice = Number(pricePerPiece) || 0;
    const sellingUnitQuantity = product.selling_unit_quantity || 1;
    
    if (unitPrice > 0 && piecePrice > 0 && sellingUnitQuantity > 0) {
      const expectedPiecePrice = unitPrice / sellingUnitQuantity;
      const difference = Math.abs(piecePrice - expectedPiecePrice);
      
      if (difference > 0.01) {
        return {
          warning: true,
          message: `Expected price per piece: ₵ ${expectedPiecePrice.toFixed(2)} (${sellingUnitQuantity} pieces × ₵ ${piecePrice.toFixed(2)} = ₵ ${(piecePrice * sellingUnitQuantity).toFixed(2)})`
        };
      }
    }
    
    return {
      warning: false,
      message: `Prices are consistent: ${sellingUnitQuantity} × ₵ ${piecePrice.toFixed(2)} = ₵ ${unitPrice.toFixed(2)}`
    };
  };

  const ratioInfo = calculateRatio();

  return (
    <div className="flex flex-col h-full w-full px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-xl text-text font-bold">Update Prices</h2>
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
              label={`Price Per ${product.selling_unit}`}
              type="number"
              step={0.01}
              placeholder="0.00"
              required
              name="price_per_unit"
              id="price_per_unit"
              value={pricePerUnit}
              onChange={handlePricePerUnitChange}
              error={errors.pricePerUnit}
              min={0}
              hint={`Current: ₵ ${product.price_per_unit?.toFixed(2)} per ${product.selling_unit}`}
            />

            <Input
              label="Price Per Piece"
              type="number"
              step={0.01}
              placeholder="0.00"
              required
              name="price_per_piece"
              id="price_per_piece"
              value={pricePerPiece}
              onChange={handlePricePerPieceChange}
              error={errors.pricePerPiece}
              min={0}
              hint={`Current: ₵ ${(product.price_per_piece || product.price_per_unit / product.selling_unit_quantity).toFixed(2)} per piece`}
            />

            {pricePerUnit && pricePerPiece && (
              <div className={`p-3 rounded-sm ${ratioInfo.warning ? 'bg-warning-5 border border-warning-20' : 'bg-success-5 border border-success-20'}`}>
                <div className="flex items-start">
                  <i className={`${ratioInfo.warning ? 'ri-error-warning-line text-warning' : 'ri-checkbox-circle-line text-success'} text-lg mr-2 mt-0.5`}></i>
                  <div>
                    <p className={`text-sm font-medium ${ratioInfo.warning ? 'text-warning' : 'text-success'} mb-1`}>
                      {ratioInfo.warning ? 'Price Consistency Check' : 'Prices are Consistent'}
                    </p>
                    <p className={`text-sm ${ratioInfo.warning ? 'text-warning' : 'text-success'}`}>
                      {ratioInfo.message}
                    </p>
                    <p className="text-xs text-text-light mt-1">
                      {product.selling_unit_quantity} pieces per {product.selling_unit}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
            disabled={loading}
            loading={loading}
          >
            Update Prices
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePriceModal;