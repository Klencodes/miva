import React, { useState, useEffect } from "react";
import { Button } from "../../../ui";
import { IProduct } from "../../../core/interfaces/IProduct";
import { formatQuantity } from "../../../core/utils/formatQuantity";

interface CustomQuantityModalProps {
  product: IProduct;
  currentQuantity?: number;
  currentIsPieces?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantity: number, isPieces: boolean) => void;
}

const CustomQuantityModal: React.FC<CustomQuantityModalProps> = ({
  product,
  currentQuantity,
  currentIsPieces = true,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState<string>("1");
  const [error, setError] = useState<string>("");
  const [selectedQuickOption, setSelectedQuickOption] = useState<number | null>(null);
  const [isPiecesMode, setIsPiecesMode] = useState<boolean>(true);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && product) {
      if (currentQuantity && currentQuantity > 0) {
        setQuantity(currentQuantity.toString());
        setIsPiecesMode(currentIsPieces !== false);
        setIsEditMode(true);
      } else {
        setQuantity("1");
        setSelectedQuickOption(null);
        // Default to units mode if selling_unit_quantity is 1 or less
        setIsPiecesMode(product.selling_unit_quantity <= 1 ? false : true);
        setIsEditMode(false);
      }
      setError("");
    }
  }, [isOpen, product, currentQuantity, currentIsPieces]);

  if (!isOpen || !product) return null;

  // Calculate available stock
  const availablePieces = product.stock * product.selling_unit_quantity;
  const availableUnits = Math.floor(availablePieces / product.selling_unit_quantity);
  
  // Calculate prices
  const pricePerPiece = product.price_per_piece || (product.price_per_unit / product.selling_unit_quantity);
  const pricePerUnit = product.price_per_unit;

  const handleQuantityChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
      setSelectedQuickOption(null);
      if (error) setError("");
    }
  };

  const handleQuickOptionSelect = (value: number, piecesMode: boolean = true) => {
    setQuantity(value.toString());
    setSelectedQuickOption(value);
    setIsPiecesMode(piecesMode);
    setError("");
  };

  const validateQuantity = (): boolean => {
    const qty = parseFloat(quantity);
    
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      return false;
    }

    // Check if quantity is a whole number when in units mode
    if (!isPiecesMode && !Number.isInteger(qty)) {
      setError(`Number of ${product.selling_unit}s must be a whole number`);
      return false;
    }

    // Calculate max available based on mode
    let maxAvailable;
    if (isPiecesMode) {
      maxAvailable = availablePieces;
      if (isEditMode && currentQuantity && currentIsPieces) {
        maxAvailable += currentQuantity;
      }
    } else {
      maxAvailable = availableUnits;
      if (isEditMode && currentQuantity && !currentIsPieces) {
        maxAvailable += currentQuantity;
      }
    }

    if (isPiecesMode) {
      if (qty > maxAvailable) {
        setError(`Only ${formatQuantity(availablePieces)} pieces available`);
        return false;
      }
    } else {
      if (qty > maxAvailable) {
        setError(`Only ${formatQuantity(availableUnits)} ${product.selling_unit}${availableUnits !== 1 ? 's' : ''} available`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateQuantity()) {
      onSubmit(parseFloat(quantity), isPiecesMode);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Generate quick options
  const getQuickOptions = () => {
    const sellingUnitQty = product.selling_unit_quantity;
    const pieceOptions: Array<{value: number, label: string, isPiecesMode: boolean}> = [];
    
    if (sellingUnitQty > 1) {
      // Add individual pieces (1-5)
      for (let i = 1; i <= Math.min(5, availablePieces); i++) {
        pieceOptions.push({value: i, label: `${i} piece${i !== 1 ? 's' : ''}`, isPiecesMode: true});
      }
      
      // Add fractional options if applicable
      if (sellingUnitQty % 2 === 0) {
        const half = sellingUnitQty / 2;
        // ONLY add if this value isn't already in the pieceOptions (prevents duplicate key 5)
        if (half <= availablePieces && half > 0 && !pieceOptions.find(opt => opt.value === half)) {
          pieceOptions.push({value: half, label: `½ ${product.selling_unit}`, isPiecesMode: true});
        }
      }
    }
    
    // Unit options
    const unitOptions: Array<{value: number, label: string, isPiecesMode: boolean}> = [];
    for (let i = 1; i <= Math.min(5, availableUnits); i++) {
      unitOptions.push({
        value: i,
        label: `${i} ${product.selling_unit}${i !== 1 ? 's' : ''}`,
        isPiecesMode: false
      });
    }
    
    return { pieceOptions, unitOptions };
  };

  const { pieceOptions, unitOptions } = getQuickOptions();
  
  // Calculate total price
  const calculateTotalPrice = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 0;
    
    if (isPiecesMode) {
      return qty * pricePerPiece;
    } else {
      return qty * pricePerUnit;
    }
  };

  const calculateEquivalentQuantity = () => {
    const qty = parseFloat(quantity) || 0;
    if (isPiecesMode) {
      const units = qty / product.selling_unit_quantity;
      return `${units.toFixed(2)} ${product.selling_unit}${units !== 1 ? 's' : ''}`;
    } else {
      const pieces = qty * product.selling_unit_quantity;
      return `${pieces} piece${pieces !== 1 ? 's' : ''}`;
    }
  };

  // Handle increment/decrement
  // eslint-disable-next-line
  const handleIncrement = () => {
    const currentValue = parseFloat(quantity) || 0;
    const step = isPiecesMode ? 1 : 1;
    const newValue = currentValue + step;
    
    // Validate against max available
    const maxAvailable = isPiecesMode ? availablePieces : availableUnits;
    if (newValue <= maxAvailable) {
      setQuantity(newValue.toString());
      setSelectedQuickOption(null);
    }
  };

  // eslint-disable-next-line
  const handleDecrement = () => {
    const currentValue = parseFloat(quantity) || 0;
    const step = isPiecesMode ? 1 : 1;
    const newValue = Math.max(1, currentValue - step);
    setQuantity(newValue.toString());
    setSelectedQuickOption(null);
  };

  // Check if we should show pieces options
  const showPiecesOptions = product.selling_unit_quantity > 1;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary-10">
          <div>
            <h3 className="text-lg font-semibold text-text">
              {isEditMode ? 'Update Quantity' : 'Add to Cart'}
            </h3>
            <p className="text-sm text-text-light mt-1">{product.short_name}</p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-text p-1">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Product Info */}
          <div className="flex items-start gap-4 mb-6 p-3 bg-background rounded-lg">
            <img
              src={product.image_url}
              alt={product.image_alt}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium text-text">{product.short_name}</h4>
              <p className="text-sm text-text-light mt-1">
                {product.selling_unit_quantity}x{product.content_measurement}
                {product.content_unit} per {product.selling_unit}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-text-light">
                  <div>Available: {availablePieces} pieces</div>
                  <div>({availableUnits} {product.selling_unit}{availableUnits !== 1 ? 's' : ''})</div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-semibold">
                    GHS {pricePerUnit?.toFixed(2)}/{product.selling_unit}
                  </div>
                  {showPiecesOptions && (
                    <div className="text-xs text-text-light">
                      GHS {pricePerPiece.toFixed(2)}/piece
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Options for Pieces Mode - Only show if selling_unit_quantity > 1 */}
          {showPiecesOptions && pieceOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                Pieces:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {pieceOptions.map((option) => (
                  <button
                    key={`piece-${option.value}`}
                    onClick={() => handleQuickOptionSelect(option.value, true)}
                    className={`p-2 rounded-lg border transition-all ${
                      selectedQuickOption === option.value && isPiecesMode === true
                        ? 'bg-primary border-primary text-white'
                        : 'bg-background border-border hover:border-primary'
                    }`}
                  >
                    <div className="font-medium text-xs">{option.label}</div>
                    <div className="text-xs text-text-light">
                      GHS {(option.value * pricePerPiece).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Options for Units */}
          {unitOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                {product.selling_unit}s:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {unitOptions.map((option) => (
                  <button
                    key={`unit-${option.value}`}
                    onClick={() => handleQuickOptionSelect(option.value, false)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedQuickOption === option.value && isPiecesMode === false
                        ? 'bg-primary border-primary text-white'
                        : 'bg-background border-border hover:border-primary'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    {showPiecesOptions && (
                      <div className="text-xs text-text-light">
                        {option.value * product.selling_unit_quantity} pieces
                      </div>
                    )}
                    <div className="text-xs text-text-light">
                      GHS {(option.value * pricePerUnit).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-2 flex justify-between">
              {isEditMode ? 'Update quantity:' : `Enter quantity in ${isPiecesMode ? 'pieces' : product.selling_unit + 's'}:`}
               <span className="text-xs text-text-light">
                    Max: {isPiecesMode ? availablePieces : availableUnits} {isPiecesMode ? 'pieces' : product.selling_unit + (availableUnits !== 1 ? 's' : '')}
                  </span>
            </label>
            <div className="flex items-center gap-3">
              
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-border rounded-sm px-4 py-1 text-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={`Enter ${isPiecesMode ? 'pieces' : product.selling_unit + 's'}`}
                    step={isPiecesMode ? "1" : "1"}
                    min="1"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light">
                    {isPiecesMode ? 'pieces' : product.selling_unit + (parseFloat(quantity) !== 1 ? 's' : '')}
                  </div>
                </div>
                
               
              </div>
            </div>         

            {error && (
              <div className="mt-2 text-danger text-sm flex items-center gap-1">
                <i className="ri-error-warning-line"></i>
                {error}
              </div>
            )}
          </div>

          {/* Price Preview */}
          <div className="mb-6 p-4 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-light">Quantity:</span>
              <span className="font-medium text-text">
                {formatQuantity(parseFloat(quantity) || 0)} {isPiecesMode ? 'pieces' : product.selling_unit + (parseFloat(quantity) !== 1 ? 's' : '')}
                {showPiecesOptions && product.selling_unit_quantity > 1 && (
                  <span className="text-text-light ml-2">
                    ({calculateEquivalentQuantity()})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-light">Total Price:</span>
              <span className="text-lg font-bold text-primary">
                GHS {calculateTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!quantity || parseFloat(quantity) <= 0}
            >
              {isEditMode ? 'Update' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomQuantityModal;