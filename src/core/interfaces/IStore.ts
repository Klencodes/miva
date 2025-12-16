import { CartItem, IProduct } from "./IProduct";

export interface ICartContentProps {
  cartItems: CartItem[];
  subTotal: number;
  total: number;
  discount: string; // Changed from number to string
  tenderedCash: string; // Changed from number to string
  paymentMethod: string;
  transactionId: string;
  balanceDue: number;
  balanceLabel: string;
  selectedCustomer: string | null;
  paymentOptions: { value: string; label: string }[];
  creatingOrder: boolean;
  setDiscount: (discount: string) => void; // Changed to accept string
  setTenderedCash: (cash: string) => void; // Changed to accept string
  setPaymentMethod: (method: string) => void;
  setTransactionId: (id: string) => void;
  removeFromCart: (product: IProduct) => void;
  updateQuantity: (product: IProduct, newQuantity: number) => void;
  openCustomerModal: () => void;
  submitOrder: () => void;
  holdOrder: () => void;
  addToCart: (product: IProduct, quantity?: number) => void;
  addQuarterToCart: (product: IProduct) => void;
  addHalfToCart: (product: IProduct) => void;
  addThreeQuarterToCart: (product: IProduct) => void;
  openHoldOrdersModal: () => void;
  formErrors?: FormErrors; // Added
  handleFormBlur?: (field: keyof OrderFormData) => void; // Added
}

export interface OrderFormData {
  discount: string;
  tenderedCash: string;
  paymentMethod: string;
  transactionId: string;
}

export interface FormErrors {
  discount?: string;
  tenderedCash?: string;
  paymentMethod?: string;
  transactionId?: string;
}

