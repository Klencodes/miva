/**
 * Interface for the Payment details within an Order.
 */
export interface IOrderPayment {
  payment_method: string;
  amount_paid: number;
  reference_id: string;
}

/**
 * Interface for a single Item within an Order's item list.
 */
export interface IOrderItem {
  order_id: string; 
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  short_name: string;
  category_name: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: number;
  selling_unit: string;
  image_url: string;
  image_alt: string;
  id: string; 
}

/**
 * Interface for a single Sales Order record.
 */
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
  payment: IOrderPayment;
  entity_id?: string; 
  id: string; 
  created_at: string;
  updated_at?: string; 
  code: string; 
}
