import { useMemo } from 'react';
import { CartItem } from '../interfaces/IProduct';
import { OrderFormData } from '../interfaces/IStore';

export const useOrderCalculations = (cartItems: CartItem[], orderFormData: OrderFormData) => {
  const parseNumericValue = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const subTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
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

  return {
    subTotal,
    discountValue,
    total,
    tenderedCashValue,
    balanceDue,
    balanceLabel,
    // Formatted versions
    formattedSubTotal: parseFloat(subTotal.toFixed(2)),
    formattedDiscount: parseFloat(discountValue.toFixed(2)),
    formattedTotal: parseFloat(total.toFixed(2)),
    formattedTenderedCash: parseFloat(tenderedCashValue.toFixed(2)),
    formattedBalanceDue: parseFloat(balanceDue.toFixed(2)),
  };
};

// Usage in your component:
// const {
//   subTotal,
//   discountValue,
//   total,
//   tenderedCashValue,
//   balanceDue,
//   balanceLabel,
// } = useOrderCalculations(cartItems, orderFormData);