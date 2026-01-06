import React, { useState, useCallback, useEffect } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct } from "../../../core/interfaces/IProduct";
import { toast } from "sonner";

const UpdateStockModal: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const product: IProduct = modalData.product;

  // Default to units mode
  const [mode, setMode] = useState<"units" | "pieces">("units");

  // Primary input values
  const [unitsInput, setUnitsInput] = useState<string>(product.stock.toString());
  const [piecesInput, setPiecesInput] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const piecesPerUnit = product.selling_unit_quantity || 1;

  // Sync pieces input when units change (and vice versa)
  useEffect(() => {
    if (mode === "units") {
      const units = parseFloat(unitsInput) || 0;
      setPiecesInput((units * piecesPerUnit).toString());
    }
  }, [unitsInput, mode, piecesPerUnit]);

  useEffect(() => {
    if (mode === "pieces") {
      const pieces = parseFloat(piecesInput) || 0;
      const units = pieces / piecesPerUnit;
      setUnitsInput(units.toFixed(4).replace(/\.?0+$/, "")); // Clean trailing zeros
    }
  }, [piecesInput, mode, piecesPerUnit]);

  const validate = useCallback((value: string): string | null => {
    if (!value || value.trim() === "") {
      return "Stock quantity is required.";
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return "Stock must be a non-negative number.";
    }
    return null;
  }, []);

  const handleUnitsChange = (value: string) => {
    setUnitsInput(value);
    setMode("units");
    setError(validate(value));
  };

  const handlePiecesChange = (value: string) => {
    setPiecesInput(value);
    setMode("pieces");
    setError(validate(value));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valueToValidate = mode === "units" ? unitsInput : piecesInput;
    const validationError = validate(valueToValidate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const newStockInUnits = parseFloat(unitsInput);
      const newStockInPieces  = parseFloat(piecesInput);

      const payload = {
        product_id: product.id,
        stock: newStockInUnits, // API expects stock in units/boxes
        // update_in_pieces: true,
        // stock_in_pieces: newStockInPieces // API expects stock in units/boxes
      };

      const response = await appService.updateProductStock(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to update stock.");
      }

      toast.success("Stock Updated Successfully", {
        description: `${product.short_name} stock updated to ${newStockInUnits.toFixed(2)} ${product.selling_unit} (${(newStockInUnits * piecesPerUnit).toFixed(0)} pieces).`,
      });

      modalRef!.close({ success: true, product: response.results });
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Could not update product stock.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Live calculations
  const currentUnits = parseFloat(unitsInput) || 0;
  const currentPieces = currentUnits * piecesPerUnit;

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
        <div className="flex-1 overflow-y-auto space-y-6 pt-4">
          <div className="space-y-5">
            {/* Units Input */}
            <Input
              label={`Stock in ${product.selling_unit} ${product.selling_unit_quantity}`}
              type="number"
              step={parseFloat("0.01")}
              placeholder="0"
              value={unitsInput}
              onChange={handleUnitsChange}
              error={mode === "units" ? error || undefined : undefined}
              min={0}
              hint={`Current: ${product.stock.toFixed(2)} ${product.selling_unit}`}
            />

            {/* Pieces Input */}
            <Input
              label="Stock in Pieces"
              type="number"
              step={parseFloat("1")}
              placeholder="0"
              value={piecesInput}
              onChange={handlePiecesChange}
              error={mode === "pieces" ? error || undefined : undefined}
              min={0}
              hint={`Current: ${(product.stock * piecesPerUnit).toFixed(0)} pieces`}
            />

            {/* Live Summary */}
            <div className="bg-info-5 border border-info-20 rounded-sm p-4">
              <div className="flex items-start">
                <i className="ri-calculator-line text-info text-xl mr-3 mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-info mb-2">Live Stock Summary</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-text">
                      <span className="font-medium">{currentUnits.toFixed(4).replace(/\.?0+$/, "")}</span> {product.selling_unit}
                      {" → "}
                      <span className="font-medium">{currentPieces.toFixed(0)}</span> pieces
                    </p>
                    <p className="text-text-light text-xs mt-2">
                      Each {product.selling_unit} contains <strong>{piecesPerUnit}</strong> piece{piecesPerUnit > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-xs text-text-light bg-background-50 p-3 rounded-sm border border-border">
              <p>
                <i className="ri-information-line mr-1"></i>
                You can update stock by entering either boxes/units <strong>or</strong> individual pieces.
                The values will sync automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            disabled={loading || !!error || !unitsInput.trim()}
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