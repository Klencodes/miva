import { CartItem, IProduct } from "./IProduct";

export interface ICartContentProps {
  cartItems: CartItem[];
  subTotal: number;
  total: number;
  discount: number;
  tenderedCash: number;
  paymentMethod: string;
  referenceId: string;
  balanceDue: number;
  balanceLabel: string;
  selectedCustomer: string | null;
  paymentOptions: { value: string; label: string }[];
  creatingOrder: boolean;
  setDiscount: (discount: number) => void;
  setTenderedCash: (cash: number) => void;
  setPaymentMethod: (method: string) => void;
  setReferenceId: (id: string) => void;
  removeFromCart: (product: IProduct) => void;
  updateQuantity: (product: IProduct, newQuantity: number) => void;
  openCustomerModal: () => void;
  submitOrder: () => void;
  holdOrder: () => void;
  addToCart: (product: IProduct, quantity?: number) => void; // Added for fractional buttons
  addQuarterToCart: (product: IProduct) => void;
  addHalfToCart: (product: IProduct) => void;
  addThreeQuarterToCart: (product: IProduct) => void;
  openHoldOrdersModal: () => void;
}
