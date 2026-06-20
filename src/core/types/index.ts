import { UserRole } from "../constants/permissions";
export interface IResponse {
  message: string;
  code: string;
  success: boolean;
  results: any
}
export interface InventoryItem {
  id: string;
  name: string;
  type: 'hose' | 'fitting' | 'ferrule' | 'assembly' | 'adapter' | 'coupling' | 'other';
  unit: 'meters' | 'feet' | 'pieces';
  quantity: number;
  specs: {
    sae?: string;
    pressure?: number;
    threadType?: 'BSP' | 'JIC' | 'NPT' | 'ORFS' | 'SAE' | 'Komatsu' | 'Metric';
    diameter?: number;
    material?: string;
    partNumber?: string;
    angle?: number;
    workingTemp?: string;
    assemblyLength?: number;
  };
  reorderThreshold: number;
  cost: number;
  price: number;
  location?: string;
  supplier?: string;
  lastUpdated?: Date;
  image?: string;
}

// core/types/index.ts
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'Cash' | 'MoMo' | 'Bank' | 'Credit';
  reference?: string; // Transaction ID, bank reference, etc.
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate?: Date;
  customer: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  vat: number;
  nhil: number;
  getfund: number;
  covidLevy: number;
  total: number;
  paymentMethod: 'Cash' | 'MoMo' | 'Bank' | 'Credit';
  momoTransactionId?: string;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  amountPaid: number;
  remainingBalance: number;
  status: 'invoiced' | 'quoted' | 'draft' | 'cancelled';
  notes?: string;
  terms?: string;
  payments?: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
}
export interface IUser {
  id: string;
  uuid: string;
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
  entities?: Entity[]
}
export interface Entity {
  id?: string;
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
  is_active: boolean;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
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
  status?: 'active' | 'inactive';
}

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

export interface ISupplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  creditLimit?: number;
  balance?: number;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  is_active?: boolean;
}

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
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export type TabType = 'dashboard' | 'inventory' | 'builder' | 'invoicing' | 'reports' | 'settings';
export type OTPType = 'verification' | 'login' | 'password_reset';

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

export interface IUserEntity {
  entity_id: string;
  role: 'super_admin' | 'admin' | 'sales' | 'viewer';
  joined_at: string;
  is_primary: boolean;
}

export interface IUserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean | string;
}

export interface IEntityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  is_active?: boolean | string;
  branch?: string;
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
  entities?: Array<{
    entity_id: string;
    role?: string;
    is_primary?: boolean;
  }>;
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
  role?: 'super_admin' | 'admin' | 'sales' | 'viewer';
  is_primary?: boolean;
}

export interface IPaginatedResponse<T> {
  [key: string]: T[] | { page: number; limit: number; total: number; totalPages: number };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
