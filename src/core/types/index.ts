export interface IResponse {
  message: string;
  code?: string;
  success: boolean;
  results: any;
  count?: number;
  next?: string;
  previous?: string;
}

/** ==========================================================================================
 * INVENTORY INTERFACE
 * ==========================================================================================
 */
export type InvItemType = 'hose' | 'fitting' | 'ferrule' | 'assembly' | 'adapter' | 'coupling' | 'other';
export type InvItemUnitType = 'meters' | 'feet' | 'pieces';
export type InvItemThreadType = 'BSP' | 'JIC' | 'NPT' | 'ORFS' | 'SAE' | 'Komatsu' | 'Metric';

export interface InventoryItem {
  uuid: string;
  entity_id: string;
  name: string;
  part_number?: string;
  type: InvItemType;
  unit: InvItemUnitType;
  quantity: number;
  reorder_threshold: number;
  cost: number;
  price: number;
  supplier?: string;
  image?: string;
  metadata?: Record<string, any>; // Flexible - can hold anything
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  total_value?: number;
  total_price_value?: number;
}
export interface InventoryFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  min_quantity?: number;
  max_quantity?: number;
  min_price?: number;
  max_price?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  supplier?: string;
}

/** ==========================================================================================
 * INVOICE INTERFACE
 * ==========================================================================================
 */
export interface Invoice {
  uuid: string;
  entity_id: string;
  number: string;
  date: string;
  due_date?: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discount_total: number;
  discount_type: DiscountType;
  discount_rate: number;
  vat: number;
  vat_rate: number;
  nhil: number;
  nhil_rate: number;
  getfund: number;
  getfund_rate: number;
  covid_levy: number;
  covid_levy_rate: number;
  total: number;
  amount_paid: number;
  remaining_balance: number;
  status: InvStatus;
  notes?: string;
  terms?: string;
  currency: string;
  payments: InvoicePayment[];
  payment_status: InvoicePaymentStatus;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export type InvoicePaymentStatus = "unpaid" | "paid" | "overdue" | "partially"
export type DiscountType = "percentage" | "fixed";
export type InvStatus = "draft" | "quoted" | "invoiced" | "cancelled"

export interface InvoiceItem {
  id: string;
  name: string;
  type: InvItemType;
  unit: InvItemUnitType;
  quantity: number;
  part_number?: string;

  specs?: {
    sae?: string;
    pressure?: number;
    thread_type?: InvItemThreadType;
    diameter?: number;
    material?: string;
    part_number?: string;
    angle?: number;
    working_temp?: string;
    assembly_length?: number;
  };
  cost: number;
  price: number;
  description?: string;
  supplier?: string;
  image?: string;
}
export interface InvoicePayment {
  payment_id?: string;
  amount: number;
  method: PaymentType;
  reference?: string;
  bank_branch?: string;
  date?: string;
}
export type PaymentType = "Cash" | "MoMo" | "Bank" | "Credit";
export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  customer?: string;
  min_total?: number;
  max_total?: number;
}

export interface InvoiceStats {
  by_status: Array<{
    status: string;
    count: number;
    total_amount: number;
    total_paid: number;
  }>;
  totals: {
    total_invoices: number;
    total_amount: number;
    total_paid: number;
    total_remaining: number;
  };
}

/** ==========================================================================================
 * CUSTOMER INTERFACE
 * ==========================================================================================
 */
export interface Customer {
  uuid?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  balance?: number;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** ==========================================================================================
 * USER INTERFACE
 * ==========================================================================================
 */
export interface IUser {
  id: string;
  uuid: string;
  primary_entity_id?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  address?: string;
  role: UserRole;
  avatar?: string;
  last_login?: string;
  permissions?: UserPermissions;
  password?: string;
  created_at?: string;
  updated_at?: string;
  verified?: boolean;
  is_active?: boolean;
  auth_token?: string;
  entities?: Entity[];
}

export type UserRole = "super_admin" | "admin" | "sales" | "technician" | "viewer"

export interface UserPermissions {
  can_edit_inventory: boolean;
  can_delete_inventory: boolean;
  can_create_invoice: boolean;
  can_edit_invoice: boolean;
  can_delete_invoice: boolean;
  can_build_assembly: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
  can_view_activity_logs: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface IUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean | string;
}

export interface ICreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  role?: string;
  permissions?: Partial<UserPermissions>;
  verified?: boolean;
  entities?: string[];
}

export interface IUpdateUserData {
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
  permissions?: Partial<UserPermissions>;
  verified?: boolean;
  is_active?: boolean;
}

/** ==========================================================================================
 * ENTITY INTERFACE
 * ==========================================================================================
 */
export interface Entity {
  id?: string;
  entity_id?: string;
  uuid: string;
  name: string;
  branch: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  registration_number: string;
  tax_id: string;
  currency?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IUserEntity {
  entity_id: string;
  role: "super_admin" | "admin" | "sales" | "viewer";
  name: string;
  branch: string;
  joined_at: string;
  is_primary: boolean;
}
export interface IEntityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  is_active?: boolean | string;
  branch?: string;
}
export interface ICreateEntityData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  registration_number?: string;
  tax_id?: string;
  branch?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IUpdateEntityData {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  registration_number?: string;
  tax_id?: string;
  branch?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  is_active?: boolean;
}

export interface IUserEntityAssignment {
  entity_id: string;
  role?: "super_admin" | "admin" | "sales" | "viewer";
  is_primary?: boolean;
}

/** ==========================================================================================
 * SUPPLIER INTERFACE
 * ==========================================================================================
 */
export interface Supplier {
  uuid: string;
  name: string;
  address: string;
  email: string;
  phone_number: string;
  secondary_number: string;
  phone_code: string;
  secondary_code: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  total_orders?: number;
  total_spent?: number;
  status?: "active" | "inactive";
}
export interface ISupplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
}

/** ==========================================================================================
 * SYSTEM INTERFACE
 * ==========================================================================================
 */
export interface SystemSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRate: number;
  nhilRate: number;
  getfundRate: number;
  covidLevyRate: number;
  currency: string;
  invoicePrefix: string;
  quotePrefix: string;
  defaultPaymentTerms: string;
  enableOfflineMode: boolean;
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
}

export type TabType =
  | "dashboard"
  | "inventory"
  | "builder"
  | "invoicing"
  | "reports"
  | "settings";
export type OTPType = "verification" | "login" | "password_reset";

export interface StoreShape {
  user: IUser | null;
  entity: Entity | null;
  storeEntities: Entity[];
  initializationComplete: boolean;
  adminExists: boolean | null;
  checkingAdmin: boolean;
  userRef: React.MutableRefObject<IUser | null>;
  isAuthenticatedRef: React.MutableRefObject<boolean>;
  entityRef: React.MutableRefObject<Entity | null>;
  isAuthenticated: boolean;
  hasStoreEntities: boolean;
  userRole: string | null;
  setUser: (userData: IUser | null) => void;
  logout: () => Promise<void>;
  setEntity: (newEntity: Entity | null) => void;
  setStoreEntities: (newEntities: Entity[] | null) => void;
  checkAuthStatus: () => Promise<{ isValid: boolean }>;
  checkAdminExists: (forceCheck?: boolean) => Promise<boolean>;
}

export interface IPaginatedResponse<T> {
  [key: string]:
    | T[]
    | { page: number; limit: number; total: number; totalPages: number };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


/** ==========================================================================================
 * DASHBOARD INTERFACE
 * ==========================================================================================
 */
export interface DashboardStats {
  inventory: {
    total_items: number;
    total_quantity: number;
    total_value: number;
    total_price: number;
    avg_cost: number;
    avg_price: number;
  };
  invoices: {
    total_invoices: number;
    total_amount: number;
    total_paid: number;
    total_remaining: number;
  };
  recent_transactions: Array<{
    id: string;
    type: 'invoice' | 'payment';
    description: string;
    amount: number;
    date: string;
    status: string;
    reference?: string;
  }>;
  weekly_sales: Array<{
    day: string;
    amount: number;
    count: number;
  }>;
  top_selling_items: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  inventory_by_type: Array<{
    name: string;
    count: number;
    quantity: number;
    value: number;
  }>;
  low_stock_count: {
    low_stock: number;
    out_of_stock: number;
    total: number;
  };
  invoice_status_breakdown: {
    draft: { count: number; amount: number };
    invoiced: { count: number; amount: number };
    partially: { count: number; amount: number };
    paid: { count: number; amount: number };
    cancelled: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
}



/** ==========================================================================================
 * CUSTOMER INTERFACE
 * ==========================================================================================
 */
export interface ICustomer {
  uuid: string;
  entity_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  balance: number;
  notes?: string;
  is_active: boolean;
  total_invoices?: number;
  total_spent?: number;
  total_paid?: number;
  total_balance?: number;
  recent_invoices?: Array<{
    uuid: string;
    number: string;
    total: number;
    status: string;
    created_at: string;
  }>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ICustomerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
  phone?: string;
  is_active?: boolean | string;
  min_balance?: number;
  max_balance?: number;
}

export interface ICustomerStats {
  totals: {
    total_customers: number;
    active_customers: number;
    inactive_customers: number;
    total_balance: number;
  };
  top_customers: Array<{
    uuid: string;
    name: string;
    balance: number;
    email?: string;
    phone?: string;
  }>;
}


/** ==========================================================================================
 * EXPENSE INTERFACE
 * ==========================================================================================
 */
export interface Expense {
  id: string;
  uuid: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  sub_category?: string;
  date: string;
  payment_method: "cash" | "bank" | "mobile_money" | "credit_card";
  status: "pending" | "paid";
  receipt_url?: string;
  vendor?: string;
  vendor_contact?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  paid_by?: string;
  paid_by_name?: string;
  paid_at?: string;
  rejected_by?: string;
  rejected_by_name?: string;
  rejected_at?: string;
  rejection_reason?: string;
  metadata?: Record<string, any>;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
  spent?: number;
}

export interface ExpenseFormData {
  title: string;
  description: string;
  amount: string;
  category: string;
  sub_category: string;
  date: string;
  payment_method: string;
  vendor: string;
  vendor_contact: string;
  status: string;
  receipt?: File | null;
}
export interface ExpenseFilters {
  search?: string;
  category?: string;
  status?: string;
  payment_method?: string;
  vendor?: string;
  start_date?: string;
  end_date?: string;
  entity_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}