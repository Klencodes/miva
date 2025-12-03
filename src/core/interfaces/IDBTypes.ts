
import { IOrderItem, IOrderPayment } from "./IOrder";
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

export interface DBPayment {
  payment_method: string;
  amount_paid: number;
  reference_id?: string;
}

export interface DBOrder {
  id?: number; // Local ID (auto-increment in IndexedDB)
  server_id?: string; // Server ID (from server response)
  code?: string;
  cashier: string | null;
  customer: string | null;
  total: number;
  subtotal: number;
  discount: number;
  tendered_cash: number;
  balance: number;
  balance_label?: string;
  items: IOrderItem[];
  payment: IOrderPayment;
  entity_id?: string;
  status?: 'pending' | 'synced' | 'failed' | 'hold';
  created_at?: string;
  synced_at?: string;
  server_created_at?: string;
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
  entity_id?: string;
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