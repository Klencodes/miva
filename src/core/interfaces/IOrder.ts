export interface IOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  price_per_piece: number;
  product_name: string;
  quantity_type: string
  short_name: string;
  category_name: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: number;
  selling_unit: string;
  image_url: string;
  image_alt: string;
  isPieces?: boolean;
}

export interface IPaymentInfo {
  payment_method: string;
  amount_paid: number;
  transaction_id: string;
}

export interface IOrderPayload {
  cashier: string;
  customer: string;
  total: number;
  subtotal: number;
  discount: number;
  tendered_cash: number;
  balance: number;
  balance_label: string;
  code: string;
  items: IOrderItem[];
  payment: IPaymentInfo;
}

export interface IOrder {
  cashier: string; 
  customer: string; 
  total: number; 
  subtotal: number; 
  discount: number;
  tendered_cash: number; 
  balance: number;
  balance_label: string; 
  items: IOrderItem[];
  payment: IPaymentInfo;
  entity_id?: string; 
  id: string; 
  created_at: string;
  updated_at?: string; 
  code: string; 
}
