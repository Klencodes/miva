import React, { useState } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct } from "../../../core/interfaces/IProduct";
import { toast } from "sonner";

interface UpdateAvailabilityModalProps {
  data: {
    product: IProduct;
  };
}

const UpdateAvailabilityModal: React.FC<UpdateAvailabilityModalProps> = () => {
  const { modalRef, modalData } = useModal();
  const product: IProduct = modalData.product;

  const [isAvailable, setIsAvailable] = useState<boolean>(product.is_available);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // NOTE: Using the POST body format you requested previously
      const payload = {
        product_id: product.id,
        is_available: isAvailable,
      };

      const response = await appService.updateProductAvailability(payload);

      if (!response.success) {
        throw new Error(response.message || "Failed to update availability.");
      }

      const status = isAvailable ? 'Available' : 'Unavailable';
      toast.success("Availability Updated", {
        description: `${product.short_name} is now marked as ${status}.`,
      });

      // Close the modal and return the updated product
      modalRef!.close({ success: true, product: response.results });
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Could not update product availability.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Set main container to flex column, taking full height
    <div className="flex flex-col h-full w-full px-2">
      {/* Header (Sticky at top of content/modal) */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-xl text-text font-bold">Update Availability</h2>
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

      {/* Form container: Uses flex-col and h-full to manage its children's height */}
      <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
        
        {/* Scrollable Content Area */}
        <div className="space-y-4 overflow-y-auto flex-1 pb-4">
          <label className="block text-sm font-medium text-text">
            Set Product Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="availability"
                checked={isAvailable === true}
                onChange={() => setIsAvailable(true)}
                className="form-radio text-success h-4 w-4"
              />
              <span className="ml-2 text-text">Available</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="availability"
                checked={isAvailable === false}
                onChange={() => setIsAvailable(false)}
                className="form-radio text-error h-4 w-4"
              />
              <span className="ml-2 text-text">Unavailable</span>
            </label>
          </div>
          <p className="text-xs text-text-light mt-1">
             Stock quantity is currently <span className="font-semibold">{product.stock.toFixed(2)} {product.selling_unit}</span>. Manual override will control visibility.
          </p>
        </div>

        {/* Footer Buttons (Fixed at bottom) */}
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
            variant={isAvailable ? "primary" : "danger"}
            disabled={loading}
            loading={loading}
            icon={isAvailable ? "check-line" : "forbid-line"}
          >
            Confirm Status
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateAvailabilityModal;