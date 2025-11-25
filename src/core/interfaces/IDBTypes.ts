import { IResponse } from "./IResponse";

export interface DBProduct {
  id: string;
  short_name?: string; 
  name: string;
  category_name: string;
  stock: number;
  price: number;
  is_available: boolean;
  image_url?: string;
  image_alt?: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: number;
  selling_unit: string;
  last_synced: string;
  entity_id: string;
}

export interface DBOrderItem {
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
  image_url?: string;
  image_alt?: string;
}

export interface DBPayment {
  payment_method: string;
  amount_paid: number;
  reference_id?: string;
}

export interface DBOrder {
  id?: number;
  server_id?: string;
  code?: string;
  cashier: string | null;
  customer: string | null;
  total: number;
  subtotal: number;
  discount: number;
  tendered_cash: number;
  balance: number;
  balance_label?: string;
  items: DBOrderItem[];
  payment: DBPayment;
  entity_id?: string;
  status?: 'pending' | 'synced' | 'failed';
  created_at?: string;
  synced_at?: string;
  // Add for cleanup
  server_created_at?: string; // When order was created on server
}
export interface DBCustomer {
  id: string; 
  server_id?: string; 
  full_name: string;
  phone_number: string;
  address: string;
  email?: string;
  status?: 'pending' | 'synced' | 'failed'; 
  created_at: string; 
  updated_at: string; 
  synced_at?: string; 
}

export interface CustomerResponse extends IResponse {
  results: DBCustomer[];
}
export interface ProductsResponse {
  success: boolean;
  results: DBProduct[];
  message: string;
  next: string | null;
  count: number;
  previous: string | null;
}

export interface OrderResponse {
  success: boolean;
  local_id?: number;
  server_id?: string;
  message?: string;
}
