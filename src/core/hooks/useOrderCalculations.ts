// useOrderCalculations.ts
import { useMemo } from 'react';
import { CartItem } from '../interfaces/IProduct';
import { OrderFormData } from '../interfaces/IStore';

export const useOrderCalculations = (cartItems: CartItem[], orderFormData: OrderFormData) => {
  const parseNumericValue = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to calculate price per piece for an item
const getPricePerPiece = (item: CartItem): number => {
  // Use price_per_piece if available, otherwise calculate it
  if (item.price_per_piece !== undefined && item.price_per_piece > 0) {
    return parseFloat(item.price_per_piece.toFixed(2));
  }
  
  // Calculate price per piece based on selling_unit_quantity
  if (item.selling_unit_quantity > 0) {
    return parseFloat((item.price_per_unit / item.selling_unit_quantity).toFixed(2));
  }
  
  // Fallback to regular price
  return parseFloat(item.price_per_unit.toFixed(2));
};

  const subTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      // Calculate price per piece
      const pricePerPiece = getPricePerPiece(item);
      
      // Multiply price per piece by the quantity in pieces
      return sum + (pricePerPiece * item.quantity);
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
    return tenderedCashValue - total;
  }, [tenderedCashValue, total]);

  const balanceLabel = useMemo(() => {
    return balanceDue >= 0 ? "Change" : "Owings";
  }, [balanceDue]);

  // Additional helper: Calculate total quantity in pieces
  const totalPieces = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Additional helper: Calculate total in terms of selling units (boxes)
  const totalSellingUnits = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const sellingUnitQuantity = item.selling_unit_quantity || 1;
      return sum + (item.quantity / sellingUnitQuantity);
    }, 0);
  }, [cartItems]);

  return {
    subTotal,
    discountValue,
    total,
    tenderedCashValue,
    balanceDue,
    balanceLabel,
    totalPieces,
    totalSellingUnits,
    getPricePerPiece,
    // Formatted versions
    formattedSubTotal: parseFloat(subTotal.toFixed(2)),
    formattedDiscount: parseFloat(discountValue.toFixed(2)),
    formattedTotal: parseFloat(total.toFixed(2)),
    formattedTenderedCash: parseFloat(tenderedCashValue.toFixed(2)),
    formattedBalanceDue: parseFloat(Math.abs(balanceDue).toFixed(2)),
    formattedTotalPieces: parseFloat(totalPieces.toFixed(2)),
    formattedTotalSellingUnits: parseFloat(totalSellingUnits.toFixed(2)),
  };
};