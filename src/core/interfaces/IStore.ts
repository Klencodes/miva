import { CartItem, IProduct } from "./IProduct";
import { SelectOption } from "./ISelectOption";

export interface ICartContentProps {
  cartItems: CartItem[];
  subTotal: number;
  total: number;
  discount: string;
  tenderedCash: string;
  paymentMethod: string;
  transactionId: string;
  balanceDue: number;
  balanceLabel: string;
  selectedCustomer: string | null;
  paymentOptions: SelectOption[];
  creatingOrder: boolean;
  setDiscount: (value: string) => void;
  setTenderedCash: (value: string) => void;
  setPaymentMethod: (value: string) => void;
  setTransactionId: (value: string) => void;
  removeFromCart: (product: IProduct) => void;
  updateQuantity: (product: IProduct, quantity: number) => void;
  openCustomerModal: () => void;
  submitOrder: () => void;
  holdOrder: () => void;
  openCustomQuantityModal: (product: IProduct, currentQuantity?: number, currentIsPieces?: boolean) => void;
  openHoldOrdersModal: () => void;
  formErrors?: FormErrors;
  handleFormBlur?: (field: keyof OrderFormData) => void;
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

