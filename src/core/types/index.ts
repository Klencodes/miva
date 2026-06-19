import { UserRole } from "../constants/permissions";

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
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  address?: string;
  role: UserRole;
  avatar?: string;
  last_login?: Date;
  permissions?: UserPermissions;
  password?: string;
  created_at?: Date;
  updated_at?: Date;
  verified?: boolean;
  isActive?: boolean;
  auth_token?: string;
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
  canEditInventory: boolean;
  canDeleteInventory: boolean;
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canBuildAssembly: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canViewActivityLogs: boolean;
}

export interface IEntityItem {
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
  isActive?: boolean;
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