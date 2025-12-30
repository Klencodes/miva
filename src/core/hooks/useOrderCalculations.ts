import { useMemo } from 'react';
import { CartItem } from '../interfaces/IProduct';
import { OrderFormData } from '../interfaces/IStore';

export const useOrderCalculations = (cartItems: CartItem[], orderFormData: OrderFormData) => {
  const parseNumericValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper to get piece price safely
  const getPricePerPiece = (item: CartItem): number => {
    if (item.price_per_piece !== undefined && item.price_per_piece > 0) {
      return item.price_per_piece;
    }
    const sellingQty = item.selling_unit_quantity || 1;
    return (item.price_per_unit || 0) / sellingQty;
  };

  // Logic must match your CartContent's getItemSubtotal exactly
  const subTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const sellingQty = item.selling_unit_quantity || 1;
      let itemPrice = 0;

      // Check isPieces (from your addToCart) OR quantity_type (from prepareOrder)
      const isPieceMode = item.isPieces === true || item.quantity_type === 'pieces';

      if (isPieceMode) {
        itemPrice = getPricePerPiece(item);
      } else {
        itemPrice = item.price_per_unit || (getPricePerPiece(item) * sellingQty);
      }

      return sum + (itemPrice * item.quantity);
    }, 0);
  }, [cartItems]);

  const discountValue = useMemo(() => {
    const discount = parseNumericValue(orderFormData.discount);
    return Math.min(Math.max(0, discount), subTotal);
  }, [orderFormData.discount, subTotal]);

  const total = useMemo(() => {
    return Math.max(0, subTotal - discountValue);
  }, [subTotal, discountValue]);

  const tenderedCashValue = useMemo(() => {
    return parseNumericValue(orderFormData.tenderedCash);
  }, [orderFormData.tenderedCash]);

const balanceDue = useMemo(() => {
  const cash = parseNumericValue(tenderedCashValue);
  const bill = parseNumericValue(total);
  
  return parseFloat((cash - bill).toFixed(2));
}, [tenderedCashValue, total]);

  return {
    subTotal,
    discountValue,
    total,
    tenderedCashValue,
    balanceDue,
    balanceLabel: balanceDue >= 0 ? "Change" : "Owings",
    getPricePerPiece,
    // Formatted versions for the UI
    formattedSubTotal: parseFloat(subTotal.toFixed(2)),
    formattedTotal: parseFloat(total.toFixed(2)),
    formattedBalanceDue: parseFloat(Math.abs(balanceDue).toFixed(2)),
  };
};