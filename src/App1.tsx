import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface InventoryItem {
  id: string;
  name: string;
  type: 'hose' | 'fitting' | 'ferrule' | 'assembly';
  unit: 'meters' | 'feet' | 'pieces';
  quantity: number;
  specs: {
    sae?: string;
    pressure?: number;
    threadType?: 'BSP' | 'JIC' | 'NPT' | 'Metric';
    diameter?: number;
    material?: string;
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

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isService?: boolean;
  discount?: number;
}

interface Invoice {
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
  amountPaid?: number;
  status: 'draft' | 'quoted' | 'invoiced' | 'cancelled';
  notes?: string;
  terms?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'technician' | 'viewer';
  avatar?: string;
  lastLogin?: Date;
  permissions?: UserPermissions;
  password?: string;
}

interface UserPermissions {
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

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  creditLimit?: number;
  balance?: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
    tension?: number;
  }[];
}

interface SystemSettings {
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

// ============================================================
// DEFAULT PERMISSIONS
// ============================================================

const defaultPermissions: Record<User['role'], UserPermissions> = {
  admin: {
    canEditInventory: true,
    canDeleteInventory: true,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: true,
    canBuildAssembly: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true,
    canViewActivityLogs: true,
  },
  sales: {
    canEditInventory: false,
    canDeleteInventory: false,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canBuildAssembly: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
    canViewActivityLogs: false,
  },
  technician: {
    canEditInventory: true,
    canDeleteInventory: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canBuildAssembly: true,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
    canViewActivityLogs: false,
  },
  viewer: {
    canEditInventory: false,
    canDeleteInventory: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canBuildAssembly: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
    canViewActivityLogs: false,
  },
};

// ============================================================
// SAMPLE DATA - PRICE LIST INTEGRATION
// ============================================================

const generateInitialInventory = (): InventoryItem[] => {
  // Two Wire Hoses
  const hoses = [
    { part: 'R2T-03', desc: '3/16" HYDRAULIC BRAIDED HOSE', price: 0.70 },
    { part: 'R2T-04', desc: '1/4" HYDRAULIC BRAIDED HOSE', price: 0.70 },
    { part: 'R2T-05', desc: '5/16" HYDRAULIC BRAIDED HOSE', price: 0.80 },
    { part: 'R2T-06', desc: '3/8" HYDRAULIC BRAIDED HOSE', price: 0.80 },
    { part: 'R2T-08', desc: '1/2" HYDRAULIC BRAIDED HOSE', price: 0.90 },
    { part: 'R2T-10', desc: '5/8" HYDRAULIC BRAIDED HOSE', price: 1.10 },
    { part: 'R2T-12', desc: '3/4" HYDRAULIC BRAIDED HOSE', price: 1.30 },
    { part: 'R2T-16', desc: '1" HYDRAULIC BRAIDED HOSE', price: 1.80 },
    { part: 'R2T-20', desc: '1 1/4" HYDRAULIC BRAIDED HOSE', price: 2.40 },
    { part: 'R2T-24', desc: '1 1/2" HYDRAULIC BRAIDED HOSE', price: 2.70 },
    { part: 'R2T-32', desc: '2" HYDRAULIC BRAIDED HOSE', price: 3.30 },
  ];

  // PTFE Teflon Hoses
  const ptfeHoses = [
    { part: 'PTFE-06', desc: '3/8" PTFE TEFLON BRAIDED HOSE', price: 1.20 },
    { part: 'PTFE-08', desc: '1/2" PTFE TEFLON BRAIDED HOSE', price: 1.30 },
    { part: 'PTFE-10', desc: '5/8" PTFE TEFLON BRAIDED HOSE', price: 1.60 },
    { part: 'PTFE-12', desc: '3/4" PTFE TEFLON BRAIDED HOSE', price: 1.70 },
    { part: 'PTFE-16', desc: '1" PTFE TEFLON BRAIDED HOSE', price: 2.30 },
  ];

  // 4SP/4SH Hoses
  const spiralHoses = [
    { part: '4SH-06', desc: '3/8" HYDRAULIC MULTI SPIRAL HOSE', price: 1.20 },
    { part: '4SH-08', desc: '1/2" HYDRAULIC MULTI SPIRAL HOSE', price: 1.30 },
    { part: '4SH-10', desc: '5/8" HYDRAULIC MULTI SPIRAL HOSE', price: 1.60 },
    { part: '4SH-12', desc: '3/4" HYDRAULIC MULTI SPIRAL HOSE', price: 1.70 },
    { part: '4SH-16', desc: '1" HYDRAULIC MULTI SPIRAL HOSE', price: 2.40 },
    { part: '4SH-20', desc: '1 1/4" HYDRAULIC MULTI SPIRAL HOSE', price: 3.20 },
    { part: '4SH-24', desc: '1 1/2" HYDRAULIC MULTI SPIRAL HOSE', price: 3.60 },
    { part: '4SH-32', desc: '2" HYDRAULIC MULTI SPIRAL HOSE', price: 4.00 },
  ];

  // Six Wire Multi Spiral
  const sixWireHoses = [
    { part: 'R13-12', desc: '3/4" SIX WIRE MULTI SPIRAL HOSE', price: 2.10 },
    { part: 'R13-16', desc: '1" SIX WIRE MULTI SPIRAL HOSE', price: 2.50 },
  ];

  // Ferrules
  const ferrules = [
    { part: 'SN2-03', desc: 'NON-SKIVE FERRULE FOR 1 BRAIDE HOSE', price: 25 },
    { part: 'SN2-04', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 25 },
    { part: 'SN2-05', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 30 },
    { part: 'SN2-06', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 30 },
    { part: 'SN2-08', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 30 },
    { part: 'SN2-10', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 35 },
    { part: 'SN2-12', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 35 },
    { part: 'SN2-16', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 55 },
    { part: 'SN2-20', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 75 },
    { part: 'SN2-24', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 90 },
    { part: 'SN2-32', desc: 'NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', price: 115 },
  ];

  // BSP Fittings
  const bspFittings = [
    { part: 'BSP-04-04', desc: 'BSP STRAIGHT FEMALE', price: 25 },
    { part: 'BSP-06-06', desc: 'BSP STRAIGHT FEMALE', price: 30 },
    { part: 'BSP-08-08', desc: 'BSP STRAIGHT FEMALE', price: 35 },
    { part: 'BSP-10-10', desc: 'BSP STRAIGHT FEMALE', price: 45 },
    { part: 'BSP-12-12', desc: 'BSP STRAIGHT FEMALE', price: 50 },
    { part: 'BSP-16-16', desc: 'BSP STRAIGHT FEMALE', price: 75 },
    { part: 'BSP-20-20', desc: 'BSP STRAIGHT FEMALE', price: 105 },
    { part: 'BSP-24-24', desc: 'BSP STRAIGHT FEMALE', price: 145 },
    { part: 'BSP-32-32', desc: 'BSP STRAIGHT FEMALE', price: 230 },
  ];

  // JIC Fittings
  const jicFittings = [
    { part: 'JIC-04-03', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 25 },
    { part: 'JIC-04-04', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 25 },
    { part: 'JIC-06-06', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 30 },
    { part: 'JIC-08-08', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 35 },
    { part: 'JIC-10-10', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 50 },
    { part: 'JIC-12-12', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 55 },
    { part: 'JIC-16-16', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 90 },
    { part: 'JIC-20-20', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 115 },
    { part: 'JIC-24-24', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 145 },
    { part: 'JIC-32-32', desc: 'JIC STRAIGHT FEMALE 37D SEAT', price: 275 },
  ];

  // Metric Fittings
  const metricFittings = [
    { part: 'MLF-06-03', desc: 'METRIC FEMALE LIGHT DUTY', price: 20 },
    { part: 'MLF-06-04', desc: 'METRIC FEMALE LIGHT DUTY', price: 20 },
    { part: 'MLF-08-04', desc: 'METRIC FEMALE LIGHT DUTY', price: 20 },
    { part: 'MLF-10-04', desc: 'METRIC FEMALE LIGHT DUTY', price: 25 },
    { part: 'MLF-10-06', desc: 'METRIC FEMALE LIGHT DUTY', price: 25 },
    { part: 'MLF-12-06', desc: 'METRIC FEMALE LIGHT DUTY', price: 30 },
    { part: 'MLF-18-06', desc: 'METRIC FEMALE LIGHT DUTY', price: 30 },
    { part: 'MLF-18-08', desc: 'METRIC FEMALE LIGHT DUTY', price: 30 },
    { part: 'MLF-18-10', desc: 'METRIC FEMALE LIGHT DUTY', price: 45 },
    { part: 'MLF-22-10', desc: 'METRIC FEMALE LIGHT DUTY', price: 45 },
    { part: 'MLF-22-12', desc: 'METRIC FEMALE LIGHT DUTY', price: 50 },
    { part: 'MLF-28-16', desc: 'METRIC FEMALE LIGHT DUTY', price: 100 },
  ];

  const allItems: InventoryItem[] = [];

  const addItems = (items: any[], type: 'hose' | 'fitting' | 'ferrule', unit: 'meters' | 'feet' | 'pieces' = 'pieces') => {
    items.forEach((item, index) => {
      allItems.push({
        id: `item-${Date.now()}-${allItems.length}-${index}`,
        name: item.desc,
        type: type,
        unit: type === 'hose' ? 'meters' : 'pieces',
        quantity: Math.floor(Math.random() * 100) + 20,
        specs: {
          sae: item.part?.includes('R2T') ? '100R2' : 
                item.part?.includes('PTFE') ? 'PTFE' :
                item.part?.includes('4SH') ? '4SH' :
                item.part?.includes('R13') ? 'R13' : undefined,
          threadType: item.desc?.includes('BSP') ? 'BSP' :
                      item.desc?.includes('JIC') ? 'JIC' :
                      item.desc?.includes('NPT') ? 'NPT' :
                      item.desc?.includes('METRIC') ? 'Metric' : undefined,
        },
        reorderThreshold: 5,
        cost: item.price * 0.6,
        price: item.price,
        location: `Aisle ${Math.floor(Math.random() * 5) + 1}, Rack ${Math.floor(Math.random() * 4) + 1}`,
        supplier: ['HydraFlex Inc.', 'SteelFlex Ltd.', 'FittingPro', 'MetricFittings GmbH'][Math.floor(Math.random() * 4)],
        lastUpdated: new Date()
      });
    });
  };

  addItems(hoses, 'hose', 'meters');
  addItems(ptfeHoses, 'hose', 'meters');
  addItems(spiralHoses, 'hose', 'meters');
  addItems(sixWireHoses, 'hose', 'meters');
  addItems(ferrules, 'ferrule');
  addItems(bspFittings, 'fitting');
  addItems(jicFittings, 'fitting');
  addItems(metricFittings, 'fitting');

  return allItems;
};

const initialInventory = generateInitialInventory();
const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'HydraFlex Inc.', contact: 'John Smith', phone: '+233 20 123 4567', email: 'john@hydraflex.com', address: '123 Industrial Rd, Accra', paymentTerms: 'Net 30' },
  { id: 's2', name: 'SteelFlex Ltd.', contact: 'Mary Johnson', phone: '+233 24 987 6543', email: 'mary@steelflex.com', address: '456 Steel Ave, Tema', paymentTerms: 'Net 45' },
  { id: 's3', name: 'FittingPro', contact: 'David Mensah', phone: '+233 55 555 5555', email: 'david@fittingpro.com', address: '789 Fitting St, Kumasi', paymentTerms: 'Net 30' },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Ghana Mining Corp', email: 'procurement@ghanamining.com', phone: '+233 30 222 1111', address: 'Mining District, Obuasi', taxId: 'GRA-12345', creditLimit: 50000, balance: 12350 },
  { id: 'c2', name: 'Accra Construction Ltd', email: 'info@accraconstruction.com', phone: '+233 30 333 2222', address: 'Construction Zone, Accra', taxId: 'GRA-67890', creditLimit: 25000, balance: 0 },
  { id: 'c3', name: 'Tema Port Authority', email: 'procurement@temaport.com', phone: '+233 30 444 3333', address: 'Port Area, Tema', taxId: 'GRA-11223', creditLimit: 75000, balance: 4500 },
];

const initialUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@hydraulic.com', role: 'admin', password: 'admin123', lastLogin: new Date() },
  { id: 'u2', name: 'John Sales', email: 'john@hydraulic.com', role: 'sales', password: 'sales123', lastLogin: new Date() },
  { id: 'u3', name: 'Mike Tech', email: 'mike@hydraulic.com', role: 'technician', password: 'tech123', lastLogin: new Date() },
  { id: 'u4', name: 'Sarah Viewer', email: 'sarah@hydraulic.com', role: 'viewer', password: 'viewer123', lastLogin: new Date() },
];

const defaultSystemSettings: SystemSettings = {
  companyName: 'Hydraulic Hose Solutions Ltd',
  companyAddress: '123 Industrial Road, Accra, Ghana',
  companyPhone: '+233 30 222 3333',
  companyEmail: 'info@hydraulicsolutions.com',
  taxRate: 12.5,
  nhilRate: 2.5,
  getfundRate: 2.5,
  covidLevyRate: 1.0,
  currency: 'GHS',
  invoicePrefix: 'INV-',
  quotePrefix: 'QUOTE-',
  defaultPaymentTerms: 'Net 30',
  enableOfflineMode: true,
  autoBackup: true,
  backupFrequency: 'daily',
};

// ============================================================
// SIMPLE CHART COMPONENTS
// ============================================================

const SimpleBarChart: React.FC<{ data: ChartData; title: string; height?: number }> = ({ data, title, height = 200 }) => {
  const maxValue = Math.max(...data.datasets[0].data, 1);
  
  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold text-text mb-3">{title}</h4>
      <div className="flex items-end h-48 gap-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index];
          const percentage = (value / maxValue) * 100;
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                style={{ 
                  height: `${Math.max(percentage, 5)}%`, 
                  backgroundColor: colors[index % colors.length],
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-text-light mt-2 font-medium">{label}</span>
              <span className="text-xs text-text-light">GHS{value.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SimplePieChart: React.FC<{ data: ChartData; title: string }> = ({ data, title }) => {
  const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold text-text mb-3">{title}</h4>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.datasets[0].data.map((value, index) => {
              const percentage = (value / total) * 100;
              const startAngle = data.datasets[0].data.slice(0, index).reduce((a, b) => a + (b / total) * 360, 0);
              const endAngle = startAngle + percentage * 3.6;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              const largeArc = percentage > 50 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-xs text-text-light">{label}</span>
              <span className="text-xs font-medium text-text">
                {((data.datasets[0].data[index] / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SimpleLineChart: React.FC<{ data: ChartData; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.datasets[0].data, 1);
  const minValue = Math.min(...data.datasets[0].data, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.datasets[0].data.map((value, index) => ({
    x: (index / (data.datasets[0].data.length - 1)) * 100,
    y: 100 - ((value - minValue) / range) * 80 - 10
  }));

  const pathData = points.map((p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold text-text mb-3">{title}</h4>
      <div className="relative h-48 w-full">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2,2" />
          ))}
          <polygon
            points={`${points.map(p => `${p.x},${p.y}`).join(' ')} ${points[points.length-1].x},100 0,100`}
            fill="rgba(59, 130, 246, 0.1)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="transition-all duration-500"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill="#3B82F6"
              className="transition-all duration-500 hover:r-4"
            />
          ))}
          {data.labels.map((label, i) => {
            const x = (i / (data.labels.length - 1)) * 100;
            return (
              <text key={i} x={x} y="98" fontSize="4" fill="#6B7280" textAnchor="middle">
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Generate sample invoices for charts
const generateSampleInvoices = (): Invoice[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const invoices: Invoice[] = [];
  let counter = 1;
  
  // Use the inventory items as the source for invoice line items
  const inventoryItems = initialInventory.slice(0, 20);
  
  for (let m = 0; m < 12; m++) {
    const count = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < count; i++) {
      const itemCount = Math.floor(Math.random() * 4) + 2;
      const items: InvoiceItem[] = [];
      let subtotal = 0;
      let discountTotal = 0;
      
      const shuffledInventory = [...inventoryItems].sort(() => Math.random() - 0.5);
      const selectedItems = shuffledInventory.slice(0, itemCount);
      
      for (const inventoryItem of selectedItems) {
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = inventoryItem.price;
        const itemTotal = quantity * unitPrice;
        const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 100) + 10 : 0;
        const discountedTotal = itemTotal - discount;
        
        items.push({
          id: `item-${counter}-${items.length}`,
          description: inventoryItem.name,
          quantity: quantity,
          unitPrice: unitPrice,
          total: discountedTotal,
          isService: false,
          discount: discount > 0 ? discount : undefined
        });
        
        subtotal += itemTotal;
        discountTotal += discount;
      }
      
      const taxableAmount = subtotal - discountTotal;
      
      invoices.push({
        id: `inv-${counter}`,
        number: `INV-${String(counter).padStart(4, '0')}`,
        date: new Date(2024, m, Math.floor(Math.random() * 28) + 1),
        customer: ['Ghana Mining Corp', 'Accra Construction Ltd', 'Tema Port Authority', 'Walk-in Customer'][Math.floor(Math.random() * 4)],
        items: items,
        subtotal: subtotal,
        discountTotal: discountTotal,
        vat: taxableAmount * 0.125,
        nhil: taxableAmount * 0.025,
        getfund: taxableAmount * 0.025,
        covidLevy: taxableAmount * 0.01,
        total: taxableAmount * 1.185,
        paymentMethod: ['Cash', 'MoMo', 'Bank', 'Credit'][Math.floor(Math.random() * 4)] as any,
        paymentStatus: ['Paid', 'Paid', 'Paid', 'Unpaid'][Math.floor(Math.random() * 4)] as any,
        status: 'invoiced',
        terms: 'Net 30'
      });
      counter++;
    }
  }
  return invoices;
};

// ============================================================
// INVOICE PRINT PREVIEW COMPONENT
// ============================================================

const InvoicePrintPreview: React.FC<{
  invoice: Invoice | null;
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
  };
  onClose: () => void;
  onPrint: () => void;
}> = ({ invoice, companyDetails, onClose, onPrint }) => {
  if (!invoice) return null;
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center no-print">
          <h3 className="text-xl font-bold text-text">📄 Invoice Preview</h3>
          <div className="flex gap-3">
            <button
              onClick={onPrint}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-[210mm] mx-auto">
            <div className="border-b-2 border-slate-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-blue-700">{companyDetails.name}</h1>
                  <p className="text-sm text-text-light mt-1">{companyDetails.address}</p>
                  <p className="text-sm text-text-light">📞 {companyDetails.phone}</p>
                  <p className="text-sm text-text-light">✉️ {companyDetails.email}</p>
                  {companyDetails.taxId && (
                    <p className="text-sm text-text-light">Tax ID: {companyDetails.taxId}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-xl border border-blue-200">
                    <h2 className="text-2xl font-bold text-blue-700">INVOICE</h2>
                    <p className="text-sm text-text-light mt-1">#{invoice.number}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Bill To</h4>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="font-semibold text-text">{invoice.customer}</p>
                  {invoice.customerEmail && (
                    <p className="text-sm text-text-light">{invoice.customerEmail}</p>
                  )}
                  {invoice.customerPhone && (
                    <p className="text-sm text-text-light">{invoice.customerPhone}</p>
                  )}
                  {invoice.customerAddress && (
                    <p className="text-sm text-text-light">{invoice.customerAddress}</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Invoice Details</h4>
                <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Invoice Date:</span>
                    <span className="font-medium text-text">{formatDate(invoice.date)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Due Date:</span>
                      <span className="font-medium text-text">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Payment Method:</span>
                    <span className="font-medium text-text">{invoice.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Payment Status:</span>
                    <span className={`font-medium ${
                      invoice.paymentStatus === 'Paid' ? 'text-emerald-600' :
                      invoice.paymentStatus === 'Partial' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {invoice.paymentStatus}
                    </span>
                  </div>
                  {invoice.momoTransactionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Transaction ID:</span>
                      <span className="font-medium text-text">{invoice.momoTransactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-light uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text-light uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text-light uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-text-light uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-text">{item.description}</td>
                      <td className="px-4 py-3 text-right text-sm text-text-light">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-text-light">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-text">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-text-light">Subtotal:</td>
                    <td className="px-4 py-2 text-right font-medium text-text">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  {invoice.discountTotal > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">Discount:</td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">-{formatCurrency(invoice.discountTotal)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">VAT ({((invoice.vat / invoice.subtotal) * 100).toFixed(1)}%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">{formatCurrency(invoice.vat)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">NHIL (2.5%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">{formatCurrency(invoice.nhil)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">GETFund (2.5%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">{formatCurrency(invoice.getfund)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">COVID-19 Levy (1%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">{formatCurrency(invoice.covidLevy)}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-text text-lg">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 text-lg">{formatCurrency(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Payment Details</h4>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Method:</span>
                    <span className="font-medium text-text">{invoice.paymentMethod}</span>
                  </div>
                  {invoice.momoTransactionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Transaction ID:</span>
                      <span className="font-medium text-text">{invoice.momoTransactionId}</span>
                    </div>
                  )}
                  {invoice.amountPaid !== undefined && invoice.amountPaid > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Amount Paid:</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                  )}
                  {invoice.paymentStatus !== 'Paid' && invoice.total - (invoice.amountPaid || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Balance Due:</span>
                      <span className="font-medium text-red-600">{formatCurrency(invoice.total - (invoice.amountPaid || 0))}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wider mb-2">Additional Info</h4>
                <div className="bg-slate-50 p-3 rounded-lg">
                  {invoice.terms && (
                    <p className="text-sm text-text-light">
                      <span className="font-medium">Terms:</span> {invoice.terms}
                    </p>
                  )}
                  {invoice.notes && (
                    <p className="text-sm text-text-light mt-1">
                      <span className="font-medium">Notes:</span> {invoice.notes}
                    </p>
                  )}
                  <p className="text-sm text-text-light mt-2">
                    Thank you for your business!
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-slate-200 pt-4 text-center">
              <p className="text-xs text-slate-400">
                This is a computer-generated invoice. No signature required.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {companyDetails.name} • {companyDetails.phone} • {companyDetails.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ADD INVENTORY MODAL
// ============================================================

const AddInventoryModal: React.FC<{
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    type: 'hose',
    unit: 'pieces',
    quantity: 0,
    specs: {},
    reorderThreshold: 0,
    cost: 0,
    price: 0,
    location: '',
    supplier: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-text flex items-center gap-2">
              <span className="text-2xl">➕</span> Add New Product
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-text-light p-1 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Product Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. R2T-06 3/8 HYDRAULIC BRAIDED HOSE"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="hose">Hose</option>
                <option value="fitting">Fitting</option>
                <option value="ferrule">Ferrule</option>
                <option value="assembly">Assembly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Unit</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as any }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="meters">Meters</option>
                <option value="feet">Feet</option>
                <option value="pieces">Pieces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Quantity *</label>
              <input 
                type="number" 
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Reorder Threshold</label>
              <input 
                type="number" 
                value={formData.reorderThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, reorderThreshold: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Cost Price (GHS)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Selling Price (GHS) *</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Aisle, Rack"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Supplier</label>
              <input 
                type="text" 
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Supplier name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Specifications</label>
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="SAE (e.g. 100R2)" 
                  value={formData.specs.sae || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, sae: e.target.value } }))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
                <input 
                  type="text" 
                  placeholder="Thread Type (e.g. BSP)" 
                  value={formData.specs.threadType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, threadType: e.target.value as any } }))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
                <input 
                  type="text" 
                  placeholder="Pressure (bar)" 
                  value={formData.specs.pressure || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, pressure: parseInt(e.target.value) || undefined } }))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (formData.name && formData.quantity > 0 && formData.price > 0) {
                  onSave(formData);
                } else {
                  alert('Please fill in all required fields (Name, Quantity, Price)');
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-200"
            >
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EDIT INVENTORY MODAL
// ============================================================

const EditInventoryModal: React.FC<{
  item: InventoryItem;
  onClose: () => void;
  onSave: (updates: Partial<InventoryItem>) => void;
}> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({ ...item });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-text flex items-center gap-2">
              <span className="text-2xl">✏️</span> Edit Product
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-text-light p-1 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Product Name</label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Type</label>
              <select 
                value={formData.type || 'hose'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="hose">Hose</option>
                <option value="fitting">Fitting</option>
                <option value="ferrule">Ferrule</option>
                <option value="assembly">Assembly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Unit</label>
              <select 
                value={formData.unit || 'pieces'}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as any }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="meters">Meters</option>
                <option value="feet">Feet</option>
                <option value="pieces">Pieces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Quantity</label>
              <input 
                type="number" 
                value={formData.quantity || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Reorder Threshold</label>
              <input 
                type="number" 
                value={formData.reorderThreshold || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, reorderThreshold: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Cost (GHS)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.cost || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Price (GHS)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.price || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Location</label>
              <input 
                type="text" 
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Supplier</label>
              <input 
                type="text" 
                value={formData.supplier || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text mb-1">Specifications</label>
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="SAE" 
                  value={formData.specs?.sae || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, sae: e.target.value } }))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
                <input 
                  type="text" 
                  placeholder="Thread Type" 
                  value={formData.specs?.threadType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, threadType: e.target.value as any } }))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
                <input 
                  type="text" 
                  placeholder="Pressure (bar)" 
                  value={formData.specs?.pressure || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, pressure: parseInt(e.target.value) || undefined } }))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (formData.name && (formData.quantity || 0) >= 0 && (formData.price || 0) >= 0) {
                  onSave(formData);
                } else {
                  alert('Please fill in all required fields');
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD COMPONENT
// ============================================================

const Dashboard: React.FC<{
  inventory: InventoryItem[];
  invoices: Invoice[];
  lowStockItems: InventoryItem[];
  totalInventoryValue: number;
  totalSales: number;
  isOffline: boolean;
  showLowStockAlert: boolean;
  setShowLowStockAlert: (show: boolean) => void;
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'builder' | 'invoicing' | 'reports' | 'settings') => void;
  generateDailyReport: () => any;
  generateStockMovement: () => any;
  generateProfitLoss: () => any;
  getMonthlyData: () => any;
  getPaymentMethodData: () => any;
}> = ({ 
  inventory, 
  invoices, 
  lowStockItems, 
  totalInventoryValue, 
  totalSales, 
  isOffline, 
  showLowStockAlert, 
  setShowLowStockAlert,
  setActiveTab,
  generateDailyReport,
  generateStockMovement,
  generateProfitLoss,
  getMonthlyData,
  getPaymentMethodData
}) => {
  const dailyReport = generateDailyReport();
  const profitLoss = generateProfitLoss();
  const monthlyData = getMonthlyData();
  const paymentData = getPaymentMethodData();

  const topSelling = useMemo(() => {
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!itemSales[item.id]) {
          itemSales[item.id] = { name: item.description, quantity: 0, revenue: 0 };
        }
        itemSales[item.id].quantity += item.quantity;
        itemSales[item.id].revenue += item.total;
      });
    });
    return Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [invoices]);

  const stockStatus = useMemo(() => {
    const total = inventory.length;
    const low = lowStockItems.length;
    const healthy = total - low;
    return { total, low, healthy };
  }, [inventory, lowStockItems]);

  const recentInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [invoices]);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-xl">📊</span>
            Dashboard Overview
          </h2>
          <p className="text-text-light text-sm mt-1">Real-time business insights at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-light bg-white px-4 py-2 shadow-sm">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {isOffline && (
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Offline Mode
            </span>
          )}
        </div>
      </div>

      {showLowStockAlert && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-red-700 font-semibold">Low Stock Alert</p>
                <p className="text-red-600 text-sm">{lowStockItems.length} items are below reorder threshold</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLowStockAlert(false)}
              className="text-red-500 hover:text-red-700 bg-white px-3 py-1 shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Inventory Value</p>
              <p className="text-2xl font-bold text-text">GHS {totalInventoryValue.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">{inventory.length} total items</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% this month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-text">GHS {totalSales.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">{invoices.length} invoices</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.11 0-2 .895-2 2s.89 2 2 2 2 .895 2 2-.89 2-2 2m0-8c1.11 0 2 .895 2 2s-.89 2-2 2-2 .895-2 2 .89 2 2 2" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+8.5% vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Today's Revenue</p>
              <p className="text-2xl font-bold text-text">GHS {dailyReport.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">{dailyReport.invoiceCount} invoices today</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-2xl shadow-lg shadow-amber-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-6 3v-3m-6 3V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{dailyReport.invoiceCount} transactions</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm font-medium">Gross Profit</p>
              <p className="text-2xl font-bold text-emerald-600">GHS {profitLoss.grossProfit.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">Margin: {profitLoss.margin.toFixed(1)}%</p>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3 rounded-2xl shadow-lg shadow-rose-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${profitLoss.margin > 30 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
              {profitLoss.margin > 30 ? 'Healthy margin ✅' : 'Margin needs improvement'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2 border border-slate-100">
          <SimpleBarChart 
            data={{
              labels: monthlyData.labels,
              datasets: [{ label: 'Monthly Revenue', data: monthlyData.values }]
            }}
            title="Monthly Revenue Trend"
            height={220}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <SimplePieChart 
            data={{
              labels: paymentData.labels,
              datasets: [{ label: 'Payment Methods', data: paymentData.values }]
            }}
            title="Payment Method Distribution"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <span className="text-lg">🏆</span> Top Selling Items
          </h3>
          {topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-sm text-text">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text">GHS {item.revenue.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 block">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No sales data available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <span className="text-lg">📦</span> Stock Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-light">Healthy Stock</span>
                <span className="font-medium text-text">{stockStatus.healthy} items</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                     style={{ width: `${(stockStatus.healthy / stockStatus.total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-light">Low Stock</span>
                <span className="font-medium text-red-600">{stockStatus.low} items</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                     style={{ width: `${(stockStatus.low / stockStatus.total) * 100}%` }} />
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-400">
              Total: {stockStatus.total} unique items
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <span className="text-lg">🕐</span> Recent Activity
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <span className="text-sm text-text">{inv.number}</span>
                    <span className="text-xs text-slate-400 block">{inv.customer}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-text">GHS {inv.total.toFixed(2)}</span>
                    <span className={`text-xs block ${inv.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveTab('builder')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-xl">🔧</span>
          <span className="font-medium">New Assembly</span>
        </button>
        <button 
          onClick={() => setActiveTab('invoicing')}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-xl">📄</span>
          <span className="font-medium">Create Invoice</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white p-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-xl">📦</span>
          <span className="font-medium">Update Stock</span>
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white p-4 rounded-2xl shadow-lg shadow-rose-200 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-xl">📈</span>
          <span className="font-medium">View Reports</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================
// INVENTORY COMPONENT
// ============================================================

const Inventory: React.FC<{
  inventory: InventoryItem[];
  filteredInventory: InventoryItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  updateInventory: (id: string, quantity: number) => void;
  editInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  permissions: UserPermissions;
  currentUser: User | null;
}> = ({ 
  inventory, 
  filteredInventory, 
  searchQuery, 
  setSearchQuery, 
  filterType, 
  setFilterType, 
  updateInventory,
  editInventoryItem,
  deleteInventoryItem,
  addInventoryItem,
  permissions,
  currentUser
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'price' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const canEdit = permissions.canEditInventory;
  const canDelete = permissions.canDeleteInventory;

  const sortedItems = useMemo(() => {
    return [...filteredInventory].sort((a, b) => {
      let compare = 0;
      if (sortField === 'name') compare = a.name.localeCompare(b.name);
      else if (sortField === 'quantity') compare = a.quantity - b.quantity;
      else if (sortField === 'price') compare = a.price - b.price;
      else if (sortField === 'type') compare = a.type.localeCompare(b.type);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredInventory, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text flex items-center gap-3">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-2 rounded-xl">📦</span>
            Inventory Management
          </h2>
          <p className="text-text-light text-sm mt-1">Track and manage your hydraulic components</p>
        </div>
        <div className="flex gap-3">
          {canEdit && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          )}
          <button className="bg-white hover:bg-slate-50 text-text px-5 py-2.5 rounded-xl shadow-md border border-slate-200 transition-all duration-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-wrap gap-4 items-center border border-slate-100">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, SAE, thread..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="all">All Types</option>
          <option value="hose">Hoses</option>
          <option value="fitting">Fittings</option>
          <option value="ferrule">Ferrules</option>
          <option value="assembly">Assemblies</option>
        </select>
        <span className="text-sm text-text-light bg-slate-100 px-3 py-1 rounded-full">
          {filteredInventory.length} items found
        </span>
        <span className="text-sm text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
          {currentUser?.role} • {currentUser?.name}
        </span>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider cursor-pointer hover:text-text" onClick={() => handleSort('name')}>
                  Product {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider cursor-pointer hover:text-text" onClick={() => handleSort('type')}>
                  Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-light uppercase tracking-wider cursor-pointer hover:text-text" onClick={() => handleSort('quantity')}>
                  Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-light uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-light uppercase tracking-wider cursor-pointer hover:text-text" onClick={() => handleSort('price')}>
                  Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Specs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-light uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.slice(0,10).map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.supplier}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.type === 'hose' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'fitting' ? 'bg-emerald-100 text-emerald-700' :
                      item.type === 'ferrule' ? 'bg-amber-100 text-amber-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">{item.unit}</td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    item.quantity <= item.reorderThreshold ? 'text-red-600' : 'text-text'
                  }`}>
                    {item.quantity}
                    {item.quantity <= item.reorderThreshold && (
                      <span className="ml-2 text-xs text-red-500">⚠️</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">GHS {item.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-text">GHS {item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-text-light">
                    <div className="space-y-0.5">
                      {item.specs.sae && <span className="text-xs block">SAE {item.specs.sae}</span>}
                      {item.specs.threadType && <span className="text-xs block">{item.specs.threadType}</span>}
                      {item.specs.pressure && <span className="text-xs block">{item.specs.pressure} bar</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">{item.location || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <button 
                        onClick={() => updateInventory(item.id, item.quantity + 1)}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1.5 transition-colors"
                        title="Add one"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => updateInventory(item.id, item.quantity - 1)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 transition-colors"
                        title="Remove one"
                        disabled={item.quantity <= 0}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => setEditingItem({ ...item })}
                          className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                              deleteInventoryItem(item.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center">
          <span className="text-sm text-text-light">Showing {sortedItems.length} of {inventory.length} items</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 hover:bg-slate-100 transition-colors text-sm">Previous</button>
            <button className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm">1</button>
            <button className="px-3 py-1 border border-slate-200 hover:bg-slate-100 transition-colors text-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddInventoryModal
          onClose={() => setShowAddModal(false)}
          onSave={(item) => {
            addInventoryItem(item);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Product Modal */}
      {editingItem && (
        <EditInventoryModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updates) => {
            editInventoryItem(editingItem.id, updates);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// HOSE BUILDER COMPONENT
// ============================================================

const HoseBuilder: React.FC<{
  inventory: InventoryItem[];
  buildHoseAssembly: (hoseId: string, fittingId: string, ferruleId: string, length: number, quantity: number) => void;
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'builder' | 'invoicing' | 'reports' | 'settings') => void;
  showNotificationMessage: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}> = ({ inventory, buildHoseAssembly, setActiveTab, showNotificationMessage }) => {
  const [selectedHose, setSelectedHose] = useState('');
  const [selectedFitting, setSelectedFitting] = useState('');
  const [selectedFerrule, setSelectedFerrule] = useState('');
  const [length, setLength] = useState(1);
  const [quantity, setQuantity] = useState(1);

  const hoses = inventory.filter(i => i.type === 'hose');
  const fittings = inventory.filter(i => i.type === 'fitting');
  const ferrules = inventory.filter(i => i.type === 'ferrule');

  const hose = inventory.find(i => i.id === selectedHose);
  const fitting = inventory.find(i => i.id === selectedFitting);
  const ferrule = inventory.find(i => i.id === selectedFerrule);

  const estimatedCost = hose && fitting && ferrule
    ? (hose.cost * length + fitting.cost * 2 + ferrule.cost * 2 + 5) * quantity
    : 0;
  const estimatedPrice = hose && fitting && ferrule
    ? (hose.price * length + fitting.price * 2 + ferrule.price * 2 + 5) * quantity
    : 0;

  const isComplete = selectedHose && selectedFitting && selectedFerrule;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-xl">🔧</span>
            Hose Builder
          </h2>
          <p className="text-text-light text-sm mt-1">Create custom hose assemblies from components</p>
        </div>
        <button 
          onClick={() => setActiveTab('inventory')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Inventory
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-text mb-4">Build New Assembly</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Select Hose</label>
                <select 
                  value={selectedHose}
                  onChange={(e) => setSelectedHose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Choose a hose...</option>
                  {hoses.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} - {h.quantity} {h.unit} available (GHS {h.price}/{h.unit})
                    </option>
                  ))}
                </select>
                {hose && (
                  <div className="mt-2 text-sm text-text-light bg-slate-50 p-2 rounded-lg">
                    Specs: {hose.specs.sae && `SAE ${hose.specs.sae}`} 
                    {hose.specs.threadType && ` • ${hose.specs.threadType}`}
                    {hose.specs.pressure && ` • ${hose.specs.pressure} bar`}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Select Fitting (2 needed)</label>
                <select 
                  value={selectedFitting}
                  onChange={(e) => setSelectedFitting(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Choose a fitting...</option>
                  {fittings.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {f.quantity} pieces available
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Select Ferrule (2 needed)</label>
                <select 
                  value={selectedFerrule}
                  onChange={(e) => setSelectedFerrule(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Choose a ferrule...</option>
                  {ferrules.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {f.quantity} pieces available
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Length per Assembly ({hose?.unit || 'meters'})</label>
                  <input 
                    type="number" 
                    value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    min="0.5"
                    step="0.5"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  if (isComplete) {
                    buildHoseAssembly(selectedHose, selectedFitting, selectedFerrule, length, quantity);
                  } else {
                    showNotificationMessage('Please select all components', 'error');
                  }
                }}
                disabled={!isComplete}
                className={`w-full py-3 rounded-xl shadow-lg transition-all duration-300 font-semibold ${
                  isComplete 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200 hover:scale-[1.02]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isComplete ? '🔧 Build Assembly' : 'Select all components to build'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-text mb-4">Assembly Summary</h3>
            {isComplete ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                  <h4 className="font-medium text-text mb-2">Components</h4>
                  <ul className="space-y-2 text-sm">
                    {hose && <li className="flex justify-between">
                      <span className="text-text-light">{hose.name}</span>
                      <span className="font-medium">{length * quantity} {hose.unit}</span>
                    </li>}
                    <li className="flex justify-between">
                      {fitting && <span className="text-text-light">{fitting.name}</span>}
                      <span className="font-medium">{2 * quantity} pieces</span>
                    </li>
                    <li className="flex justify-between">
                      {ferrule && <span className="text-text-light">{ferrule.name}</span>}
                      <span className="font-medium">{2 * quantity} pieces</span>
                    </li>
                    <li className="flex justify-between text-text-light">
                      <span>Labor (crimping)</span>
                      <span>GHS 5.00 × {quantity}</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-text-light">Estimated Cost</span>
                    <span className="text-text">GHS {estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-text-light">Estimated Price</span>
                    <span className="text-blue-600">GHS {estimatedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Margin</span>
                    <span className={`font-medium ${estimatedPrice > 0 && ((estimatedPrice - estimatedCost) / estimatedPrice * 100) > 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {estimatedPrice > 0 ? ((estimatedPrice - estimatedCost) / estimatedPrice * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔌</div>
                <p className="text-slate-400 text-sm">Select components to see summary</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mt-4 border border-slate-100">
            <h3 className="text-lg font-semibold text-text mb-4">Recent Assemblies</h3>
            {inventory.filter(i => i.type === 'assembly').slice(-3).map(item => (
              <div key={item.id} className="border-b border-slate-100 last:border-0 py-3">
                <div className="font-medium text-sm text-text">{item.name}</div>
                <div className="text-xs text-text-light flex justify-between">
                  <span>Qty: {item.quantity}</span>
                  <span>GHS {item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {inventory.filter(i => i.type === 'assembly').length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No assemblies created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ADD USER MODAL
// ============================================================

const AddUserModal: React.FC<{
  onClose: () => void;
  onSave: (user: Omit<User, 'id'>) => void;
  roles: string[];
}> = ({ onClose, onSave, roles }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: 'viewer',
    password: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-text">Add New User</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-text-light p-1 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Role</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (formData.name && formData.email && formData.password) {
                  onSave(formData);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Add User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EDIT USER MODAL
// ============================================================

const EditUserModal: React.FC<{
  user: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => void;
  roles: string[];
}> = ({ user, onClose, onSave, roles }) => {
  const [formData, setFormData] = useState<Partial<User>>({ ...user });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-text">Edit User</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-text-light p-1 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Full Name</label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <input 
                type="email" 
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">New Password (leave blank to keep current)</label>
              <input 
                type="password" 
                value={formData.password || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Role</label>
              <select 
                value={formData.role || 'viewer'}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                const updates: Partial<User> = { ...formData };
                if (!updates.password) delete updates.password;
                onSave(updates);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EDIT PERMISSIONS MODAL
// ============================================================

const EditPermissionsModal: React.FC<{
  user: User;
  onClose: () => void;
  onSave: (permissions: Partial<UserPermissions>) => void;
}> = ({ user, onClose, onSave }) => {
  const [perms, setPerms] = useState<Partial<UserPermissions>>(
    user.permissions || defaultPermissions[user.role]
  );

  const permissionLabels: Record<keyof UserPermissions, string> = {
    canEditInventory: 'Edit Inventory',
    canDeleteInventory: 'Delete Inventory',
    canCreateInvoice: 'Create Invoices',
    canEditInvoice: 'Edit Invoices',
    canDeleteInvoice: 'Delete Invoices',
    canBuildAssembly: 'Build Assemblies',
    canManageUsers: 'Manage Users',
    canViewReports: 'View Reports',
    canManageSettings: 'Manage Settings',
    canViewActivityLogs: 'View Activity Logs',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-text">
              Manage Permissions: {user.name}
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-text-light p-1 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-text">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perms[key as keyof UserPermissions] || false}
                    onChange={(e) => setPerms(prev => ({ 
                      ...prev, 
                      [key]: e.target.checked 
                    }))}
                    className="sr-only peer"
                    disabled={user.role === 'admin'}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(perms)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// REPORTS COMPONENT
// ============================================================

const Reports: React.FC<{
  generateDailyReport: () => any;
  generateStockMovement: () => any;
  generateProfitLoss: () => any;
  getMonthlyData: () => any;
  getPaymentMethodData: () => any;
  invoices: Invoice[];
}> = ({ generateDailyReport, generateStockMovement, generateProfitLoss, getMonthlyData, getPaymentMethodData, invoices }) => {
  const dailyReport = generateDailyReport();
  const stockMovement = generateStockMovement();
  const profitLoss = generateProfitLoss();
  const monthlyData = getMonthlyData();
  const paymentData = getPaymentMethodData();

  const taxBreakdown = useMemo(() => {
    const totalVAT = invoices.reduce((sum, i) => sum + i.vat, 0);
    const totalNHIL = invoices.reduce((sum, i) => sum + i.nhil, 0);
    const totalGETFund = invoices.reduce((sum, i) => sum + i.getfund, 0);
    const totalCovid = invoices.reduce((sum, i) => sum + i.covidLevy, 0);
    return { totalVAT, totalNHIL, totalGETFund, totalCovid };
  }, [invoices]);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text flex items-center gap-3">
            <span className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-2 rounded-xl">📈</span>
            Reports & Analytics
          </h2>
          <p className="text-text-light text-sm mt-1">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white hover:bg-slate-50 text-text px-4 py-2 rounded-xl shadow-md border border-slate-200 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">📊 Daily Report</span>
            <span className="text-sm text-slate-400">{dailyReport.date}</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">Total Revenue</span>
              <span className="font-bold text-text">GHS {dailyReport.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">Invoices</span>
              <span className="font-bold text-text">{dailyReport.invoiceCount}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">Payment Methods</span>
              <span className="text-sm text-text-light">
                Cash: GHS {dailyReport.paymentMethods.Cash.toFixed(2)} | 
                MoMo: GHS {dailyReport.paymentMethods.MoMo.toFixed(2)} | 
                Bank: GHS {dailyReport.paymentMethods.Bank.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors text-sm">
                Export PDF
              </button>
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors text-sm">
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">💰 Profit & Loss Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">Revenue</span>
              <span className="font-bold text-text">GHS {profitLoss.revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">COGS</span>
              <span className="font-bold text-text">GHS {profitLoss.cogs.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">Gross Profit</span>
              <span className="font-bold text-emerald-600">GHS {profitLoss.grossProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-text-light">Margin</span>
              <span className="font-bold text-blue-600">{profitLoss.margin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Tax Liability (VAT)</span>
              <span className="font-bold text-amber-600">GHS {profitLoss.taxLiability.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <SimpleLineChart 
            data={{
              labels: monthlyData.labels,
              datasets: [{ label: 'Monthly Revenue', data: monthlyData.values }]
            }}
            title="Monthly Revenue Trend"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          <SimplePieChart 
            data={{
              labels: paymentData.labels,
              datasets: [{ label: 'Payment Methods', data: paymentData.values }]
            }}
            title="Payment Distribution"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 lg:col-span-2">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">📦 Stock Movement</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-light uppercase">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-text-light uppercase">Movement</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-text-light uppercase">Turnover</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-text-light uppercase">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovement.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-text">{item.name}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-blue-600">+{item.movement}</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">{item.turnover}x</td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-text">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 lg:col-span-2">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">🧾 Tax Breakdown (GRA Compliant)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">VAT (12.5%)</p>
              <p className="text-xl font-bold text-blue-700">GHS {taxBreakdown.totalVAT.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">NHIL (2.5%)</p>
              <p className="text-xl font-bold text-emerald-700">GHS {taxBreakdown.totalNHIL.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-600 font-medium">GETFund (2.5%)</p>
              <p className="text-xl font-bold text-amber-700">GHS {taxBreakdown.totalGETFund.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 text-center">
              <p className="text-sm text-rose-600 font-medium">COVID-19 (1%)</p>
              <p className="text-xl font-bold text-rose-700">GHS {taxBreakdown.totalCovid.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// INVOICING COMPONENT
// ============================================================

const Invoicing: React.FC<{
  invoices: Invoice[];
  inventory: InventoryItem[];
  customers: Customer[];
  totalSales: number;
  systemSettings: SystemSettings;
  createInvoice: (customer: string, items: InvoiceItem[], paymentMethod: 'Cash' | 'MoMo' | 'Bank' | 'Credit', momoId?: string, customerEmail?: string, customerPhone?: string, notes?: string) => void;
  convertQuoteToInvoice: (quoteId: string) => void;
  cancelInvoice: (invoiceId: string) => void;
  showNotificationMessage: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}> = ({ invoices, inventory, customers, totalSales, systemSettings, createInvoice, convertQuoteToInvoice, cancelInvoice, showNotificationMessage }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'MoMo' | 'Bank' | 'Credit'>('Cash');
  const [momoId, setMomoId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  
  // Payment method specific states
  const [cashTendered, setCashTendered] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [momoProvider, setMomoProvider] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoStatus, setMomoStatus] = useState('Completed');
  const [bankReference, setBankReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankStatus, setBankStatus] = useState('Confirmed');
  const [bankNotes, setBankNotes] = useState('');
  const [creditTerms, setCreditTerms] = useState('Net 30');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [creditPONumber, setCreditPONumber] = useState('');
  const [creditNotes, setCreditNotes] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const addItemToInvoice = (itemId: string, quantity: number) => {
    const invItem = inventory.find(i => i.id === itemId);
    if (invItem && invItem.quantity >= quantity) {
      const existing = invoiceItems.find(i => i.id === itemId);
      if (existing) {
        setInvoiceItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.unitPrice }
            : i
        ));
      } else {
        setInvoiceItems(prev => [...prev, {
          id: itemId,
          description: invItem.name,
          quantity,
          unitPrice: invItem.price,
          total: quantity * invItem.price,
        }]);
      }
      showNotificationMessage(`Added ${invItem.name} to invoice`, 'success');
    } else {
      showNotificationMessage('Insufficient stock or item not found', 'error');
    }
  };

  const removeItemFromInvoice = (itemId: string) => {
    setInvoiceItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleCreateInvoice = () => {
    if (!selectedCustomer) {
      showNotificationMessage('Please select a customer', 'error');
      return;
    }
    if (invoiceItems.length === 0) {
      showNotificationMessage('Please add items to invoice', 'error');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    createInvoice(
      customer?.name || 'Walk-in Customer',
      invoiceItems,
      paymentMethod,
      paymentMethod === 'MoMo' ? momoId : undefined,
      customer?.email,
      customer?.phone
    );
    setShowCreateModal(false);
    setInvoiceItems([]);
    setSelectedCustomer('');
    setMomoId('');
    // Reset payment-specific fields
    setCashTendered('');
    setCashNote('');
    setMomoProvider('');
    setMomoPhone('');
    setMomoStatus('Completed');
    setBankReference('');
    setBankName('');
    setBankAccountName('');
    setBankStatus('Confirmed');
    setBankNotes('');
    setCreditTerms('Net 30');
    setCreditDueDate('');
    setCreditPONumber('');
    setCreditNotes('');
  };

  const handlePrintPreview = (invoice: Invoice) => {
    setSelectedInvoiceForPrint(invoice);
    setShowPrintPreview(true);
  };

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);
  const vat = subtotal * (systemSettings.taxRate / 100);
  const nhil = subtotal * (systemSettings.nhilRate / 100);
  const getfund = subtotal * (systemSettings.getfundRate / 100);
  const covidLevy = subtotal * (systemSettings.covidLevyRate / 100);
  const total = subtotal + vat + nhil + getfund + covidLevy;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text flex items-center gap-3">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-2 rounded-xl">📄</span>
            Invoicing
          </h2>
          <p className="text-text-light text-sm mt-1">Create and manage professional invoices</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-200 transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <p className="text-text-light text-sm">Total Invoices</p>
          <p className="text-2xl font-bold text-text">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <p className="text-text-light text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">GHS {totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <p className="text-text-light text-sm">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">
            GHS {invoices.filter(i => i.paymentStatus !== 'Paid').reduce((sum, i) => sum + i.total, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-light uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-light uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 20).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{inv.number}</td>
                  <td className="px-4 py-3">
                    <div className="text-text">{inv.customer}</div>
                    {inv.customerEmail && <div className="text-xs text-slate-400">{inv.customerEmail}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-text">GHS {inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-light">{inv.paymentMethod}</span>
                    {inv.momoTransactionId && (
                      <div className="text-xs text-slate-400">ID: {inv.momoTransactionId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block w-fit ${
                        inv.status === 'invoiced' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'quoted' ? 'bg-amber-100 text-amber-700' :
                        inv.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-text'
                      }`}>
                        {inv.status}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block w-fit ${
                        inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        inv.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handlePrintPreview(inv)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 transition-colors" 
                        title="Print / PDF Preview"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      {inv.status === 'quoted' && (
                        <button 
                          onClick={() => convertQuoteToInvoice(inv.id)}
                          className="text-emerald-600 hover:text-emerald-800 p-1.5 hover:bg-emerald-50 transition-colors"
                          title="Convert to Invoice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {inv.status === 'invoiced' && (
                        <button 
                          onClick={() => cancelInvoice(inv.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 transition-colors"
                          title="Cancel Invoice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center">
          <span className="text-sm text-text-light">Showing {Math.min(invoices.length, 20)} of {invoices.length} invoices</span>
          <span className="text-sm text-text-light">Total Revenue: GHS {totalSales.toFixed(2)}</span>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text">Create New Invoice</h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setInvoiceItems([]);
                    setSelectedCustomer('');
                  }}
                  className="text-slate-400 hover:text-text-light p-1 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Customer</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {customerSearch && (
                      <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {filteredCustomers.map(c => (
                          <div 
                            key={c.id}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                            onClick={() => {
                              setSelectedCustomer(c.id);
                              setCustomerSearch(c.name);
                            }}
                          >
                            <div className="font-medium text-text">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCustomer && (
                    <div className="mt-1 text-sm text-emerald-600 flex items-center gap-1">
                      <span>✅</span> Selected: {customers.find(c => c.id === selectedCustomer)?.name}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Payment Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value as any);
                      setMomoId('');
                      setBankReference('');
                      setCashTendered('');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="MoMo">📱 Mobile Money</option>
                    <option value="Bank">🏦 Bank Transfer</option>
                    <option value="Credit">📋 Credit (Invoice)</option>
                  </select>
                </div>
              </div>

              {/* Payment Method Specific Fields */}
              <div className="mb-6">
                {paymentMethod === 'Cash' && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">💵</span>
                      <h4 className="font-semibold text-emerald-800">Cash Payment Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Amount Tendered</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-light">GHS</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            className="w-full pl-12 p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Change Due</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-light">GHS</span>
                          <input
                            type="text"
                            value={cashTendered ? (parseFloat(cashTendered) - total).toFixed(2) : '0.00'}
                            className="w-full pl-12 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-text-light"
                            disabled
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text mb-1">Payment Note</label>
                        <input
                          type="text"
                          placeholder="Optional notes about cash payment"
                          value={cashNote}
                          onChange={(e) => setCashNote(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'MoMo' && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📱</span>
                      <h4 className="font-semibold text-purple-800">Mobile Money Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Transaction ID</label>
                        <input
                          type="text"
                          placeholder="e.g. MOMO-123456789"
                          value={momoId}
                          onChange={(e) => setMomoId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Mobile Money Provider</label>
                        <select 
                          value={momoProvider}
                          onChange={(e) => setMomoProvider(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                          <option value="">Select provider...</option>
                          <option value="MTN MoMo">MTN MoMo</option>
                          <option value="Vodafone Cash">Vodafone Cash</option>
                          <option value="AirtelTigo Money">AirtelTigo Money</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Customer Phone Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. 024XXXXXXXX"
                          value={momoPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Transaction Status</label>
                        <select 
                          value={momoStatus}
                          onChange={(e) => setMomoStatus(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                          <option value="Completed">✅ Completed</option>
                          <option value="Pending">⏳ Pending</option>
                          <option value="Failed">❌ Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Bank' && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🏦</span>
                      <h4 className="font-semibold text-blue-800">Bank Transfer Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Reference Number</label>
                        <input
                          type="text"
                          placeholder="e.g. BNK-2024-001"
                          value={bankReference}
                          onChange={(e) => setBankReference(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Bank Name</label>
                        <select 
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">Select bank...</option>
                          <option value="Ghana Commercial Bank">Ghana Commercial Bank</option>
                          <option value="Stanbic Bank">Stanbic Bank</option>
                          <option value="Ecobank">Ecobank</option>
                          <option value="Access Bank">Access Bank</option>
                          <option value="Absa Bank">Absa Bank</option>
                          <option value="Fidelity Bank">Fidelity Bank</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Account Name (Sender)</label>
                        <input
                          type="text"
                          placeholder="Sender's account name"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Transfer Status</label>
                        <select 
                          value={bankStatus}
                          onChange={(e) => setBankStatus(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="Confirmed">✅ Confirmed</option>
                          <option value="Pending">⏳ Pending</option>
                          <option value="Rejected">❌ Rejected</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text mb-1">Additional Notes</label>
                        <input
                          type="text"
                          placeholder="Any additional bank transfer details"
                          value={bankNotes}
                          onChange={(e) => setBankNotes(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Credit' && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📋</span>
                      <h4 className="font-semibold text-amber-800">Credit / Invoice Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Credit Terms</label>
                        <select 
                          value={creditTerms}
                          onChange={(e) => setCreditTerms(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all"
                        >
                          <option value="Net 15">Net 15 (15 days)</option>
                          <option value="Net 30">Net 30 (30 days)</option>
                          <option value="Net 45">Net 45 (45 days)</option>
                          <option value="Net 60">Net 60 (60 days)</option>
                          <option value="Due on Receipt">Due on Receipt</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Due Date</label>
                        <input
                          type="date"
                          value={creditDueDate}
                          onChange={(e) => setCreditDueDate(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Credit Limit Used</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-light">GHS</span>
                          <input
                            type="text"
                            value={total.toFixed(2)}
                            className="w-full pl-12 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-text-light"
                            disabled
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Customer PO Number</label>
                        <input
                          type="text"
                          placeholder="e.g. PO-2024-001"
                          value={creditPONumber}
                          onChange={(e) => setCreditPONumber(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text mb-1">Credit Notes</label>
                        <input
                          type="text"
                          placeholder="Special instructions or notes for credit"
                          value={creditNotes}
                          onChange={(e) => setCreditNotes(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-text mb-2">Add Items</h4>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                    onChange={(e) => {
                      const itemId = e.target.value;
                      if (itemId) {
                        addItemToInvoice(itemId, 1);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select an item...</option>
                    {inventory.filter(i => i.quantity > 0).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.quantity} available (GHS {item.price})
                      </option>
                    ))}
                  </select>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                    Add
                  </button>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text-light">Description</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-text-light">Qty</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-text-light">Unit Price</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-text-light">Total</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-text-light">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-text">{item.description}</td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              setInvoiceItems(prev => prev.map(i => 
                                i.id === item.id 
                                  ? { ...i, quantity: qty, total: qty * i.unitPrice }
                                  : i
                              ));
                            }}
                            className="w-16 p-1.5 border border-slate-200 text-right focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-text-light">GHS {item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-medium text-text">GHS {item.total.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <button 
                            onClick={() => removeItemFromInvoice(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 transition-colors"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right font-medium text-text-light">Subtotal:</td>
                      <td className="px-4 py-2 text-right font-medium text-text">GHS {subtotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">VAT ({systemSettings.taxRate}%):</td>
                      <td className="px-4 py-2 text-right text-sm text-text-light">GHS {vat.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">NHIL ({systemSettings.nhilRate}%):</td>
                      <td className="px-4 py-2 text-right text-sm text-text-light">GHS {nhil.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">GETFund ({systemSettings.getfundRate}%):</td>
                      <td className="px-4 py-2 text-right text-sm text-text-light">GHS {getfund.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">COVID-19 Levy ({systemSettings.covidLevyRate}%):</td>
                      <td className="px-4 py-2 text-right text-sm text-text-light">GHS {covidLevy.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <td colSpan={3} className="px-4 py-2 text-right font-bold text-text">Total:</td>
                      <td className="px-4 py-2 text-right font-bold text-blue-600">GHS {total.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setInvoiceItems([]);
                    setSelectedCustomer('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateInvoice}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && selectedInvoiceForPrint && (
        <InvoicePrintPreview
          invoice={selectedInvoiceForPrint}
          companyDetails={{
            name: systemSettings.companyName,
            address: systemSettings.companyAddress,
            phone: systemSettings.companyPhone,
            email: systemSettings.companyEmail,
            taxId: 'GRA-123456789'
          }}
          onClose={() => {
            setShowPrintPreview(false);
            setSelectedInvoiceForPrint(null);
          }}
          onPrint={() => {
            window.print();
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// SETTINGS COMPONENT
// ============================================================

const Settings: React.FC<{
  currentUser: User | null;
  isOffline: boolean;
  pendingSync: Invoice[];
  activityLogs: ActivityLog[];
  users: User[];
  systemSettings: SystemSettings;
  updateUser: (userId: string, updates: Partial<User>) => void;
  setPendingSync: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  showNotificationMessage: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  permissions: UserPermissions;
}> = ({ 
  currentUser, 
  isOffline, 
  pendingSync, 
  activityLogs, 
  users, 
  systemSettings,
  setPendingSync,
  setInvoices,
  updateUser,
  addUser,
  deleteUser,
  updateSystemSettings,
  showNotificationMessage,
  permissions 
}) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<'general' | 'users' | 'permissions' | 'tax' | 'backup'>('general');
  
  const canManageUsers = permissions.canManageUsers;
  const canManageSettings = permissions.canManageSettings;

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    addUser(userData);
    setShowUserModal(false);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    updateUser(userId, updates);
    setEditingUser(null);
  };

  const handleUpdatePermissions = (userId: string, permUpdates: Partial<UserPermissions>) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUser(userId, {
        permissions: { ...(user.permissions || defaultPermissions[user.role]), ...permUpdates } as UserPermissions
      });
    }
    setEditingPermissions(null);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div>
        <h2 className="text-3xl font-bold text-text flex items-center gap-3 mb-1">
          <span className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-2 rounded-xl">⚙️</span>
          Settings
        </h2>
        <p className="text-text-light text-sm mb-6">System configuration and preferences</p>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 border border-slate-100 flex flex-wrap gap-1">
        {['general', 'users', 'permissions', 'tax', 'backup'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === section
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                : 'text-text-light hover:bg-slate-50'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        {activeSection === 'general' && (
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">🏢 General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-light">Company Name</label>
                <input 
                  type="text" 
                  value={systemSettings.companyName}
                  onChange={(e) => updateSystemSettings({ companyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">Company Address</label>
                <input 
                  type="text" 
                  value={systemSettings.companyAddress}
                  onChange={(e) => updateSystemSettings({ companyAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">Company Phone</label>
                <input 
                  type="text" 
                  value={systemSettings.companyPhone}
                  onChange={(e) => updateSystemSettings({ companyPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">Company Email</label>
                <input 
                  type="text" 
                  value={systemSettings.companyEmail}
                  onChange={(e) => updateSystemSettings({ companyEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">Currency</label>
                <input 
                  type="text" 
                  value={systemSettings.currency}
                  onChange={(e) => updateSystemSettings({ currency: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">Invoice Prefix</label>
                <input 
                  type="text" 
                  value={systemSettings.invoicePrefix}
                  onChange={(e) => updateSystemSettings({ invoicePrefix: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
            </div>
            {!canManageSettings && (
              <div className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
                You don't have permission to modify general settings.
              </div>
            )}
          </div>
        )}

        {/* User Management */}
        {activeSection === 'users' && (
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-text flex items-center gap-2">👤 User Management</h3>
              {canManageUsers && (
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-light uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-light uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-light uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-light uppercase">Last Login</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-text-light uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium text-text">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'sales' ? 'bg-emerald-100 text-emerald-700' :
                          user.role === 'technician' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-text'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canManageUsers && user.id !== currentUser?.id && (
                            <button 
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          {canManageUsers && user.id !== currentUser?.id && (
                            <button 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                  deleteUser(user.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          <button 
                            onClick={() => setEditingPermissions(user)}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 transition-colors"
                            title="Manage Permissions"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!canManageUsers && (
              <div className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
                You don't have permission to manage users.
              </div>
            )}
          </div>
        )}

        {/* Permissions Management */}
        {activeSection === 'permissions' && (
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">🔐 Role-Based Permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-text-light uppercase">Permission</th>
                    {['admin', 'sales', 'technician', 'viewer'].map(role => (
                      <th key={role} className="px-4 py-2 text-center text-xs font-medium text-text-light uppercase">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(defaultPermissions.admin).map(([key, _]) => (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-sm text-text">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </td>
                      {['admin', 'sales', 'technician', 'viewer'].map(role => (
                        <td key={role} className="px-4 py-2 text-center">
                          {defaultPermissions[role as keyof typeof defaultPermissions][key as keyof UserPermissions] ? (
                            <span className="text-emerald-600">✓</span>
                          ) : (
                            <span className="text-red-400">✕</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-text-light bg-slate-50 p-3 rounded-xl">
              <p>💡 Permissions define what each role can access. Admins can modify these in the Users section.</p>
            </div>
          </div>
        )}

        {/* Tax Configuration */}
        {activeSection === 'tax' && (
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">🏛️ Tax Configuration (GRA Standards)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-light">VAT Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={systemSettings.taxRate}
                  onChange={(e) => updateSystemSettings({ taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">NHIL Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={systemSettings.nhilRate}
                  onChange={(e) => updateSystemSettings({ nhilRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">GETFund Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={systemSettings.getfundRate}
                  onChange={(e) => updateSystemSettings({ getfundRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">COVID-19 Levy (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={systemSettings.covidLevyRate}
                  onChange={(e) => updateSystemSettings({ covidLevyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={!canManageSettings}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button 
                className={`${canManageSettings ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-slate-300 cursor-not-allowed'} text-white px-4 py-2.5 rounded-xl transition-colors`}
                disabled={!canManageSettings}
              >
                Save Tax Configuration
              </button>
              <button className="border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-colors">
                Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Backup & Offline */}
        {activeSection === 'backup' && (
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">💾 Backup & Offline Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="font-medium text-text">Offline Mode</p>
                  <p className="text-sm text-text-light">Work without internet connection</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${isOffline ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {isOffline ? '🟡 Active' : '🟢 Online'}
                  </span>
                  <button 
                    className={`${canManageSettings ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'} text-white px-4 py-2 rounded-xl transition-colors`}
                    disabled={!canManageSettings}
                    onClick={() => updateSystemSettings({ enableOfflineMode: !systemSettings.enableOfflineMode })}
                  >
                    {systemSettings.enableOfflineMode ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="font-medium text-text">Auto Backup</p>
                  <p className="text-sm text-text-light">Automatically backup system data</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    className={`${canManageSettings ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'} text-white px-4 py-2 rounded-xl transition-colors`}
                    disabled={!canManageSettings}
                    onClick={() => updateSystemSettings({ autoBackup: !systemSettings.autoBackup })}
                  >
                    {systemSettings.autoBackup ? 'On' : 'Off'}
                  </button>
                  <select 
                    value={systemSettings.backupFrequency}
                    onChange={(e) => updateSystemSettings({ backupFrequency: e.target.value as any })}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={!canManageSettings || !systemSettings.autoBackup}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Pending Sync</p>
                  <p className="text-sm text-text-light">{pendingSync.length} invoices waiting to sync</p>
                </div>
                <button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors"
                  onClick={() => {
                    if (pendingSync.length > 0 && !isOffline) {
                      setInvoices(prev => [...prev, ...pendingSync]);
                      setPendingSync([]);
                      showNotificationMessage(`Synced ${pendingSync.length} invoices!`, 'success');
                    } else if (isOffline) {
                      showNotificationMessage('Connect to internet to sync', 'warning');
                    } else {
                      showNotificationMessage('No pending sync', 'info');
                    }
                  }}
                >
                  Sync Now
                </button>
              </div>
              <div className="mt-4 text-sm text-text-light bg-slate-50 p-3 rounded-xl">
                Last backup: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs - Always visible */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-slate-100 mt-6">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">📋 Recent Activity Logs</h3>
          <div className="max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {activityLogs.slice(-10).reverse().map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-100 pb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-text-light">
                    {log.userName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between">
                      <span className="text-sm font-medium text-text">{log.userName}</span>
                      <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-text-light">{log.action}</p>
                    <p className="text-xs text-slate-400">{log.details}</p>
                  </div>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">No activity logs yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <AddUserModal
          onClose={() => setShowUserModal(false)}
          onSave={handleAddUser}
          roles={['admin', 'sales', 'technician', 'viewer']}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updates) => handleUpdateUser(editingUser.id, updates)}
          roles={['admin', 'sales', 'technician', 'viewer']}
        />
      )}

      {/* Edit Permissions Modal */}
      {editingPermissions && (
        <EditPermissionsModal
          user={editingPermissions}
          onClose={() => setEditingPermissions(null)}
          onSave={(permUpdates) => handleUpdatePermissions(editingPermissions.id, permUpdates)}
        />
      )}
    </div>
  );
};

// ============================================================
// LOGIN COMPONENT
// ============================================================

const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin@hydraulic.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = initialUsers.find(u => 
      u.email.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      onLogin({ ...user, lastLogin: new Date() });
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 bg-gradient-to-br from-blue-600 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
            <span className="text-white">🔧</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Hydraulic Hose Management</h1>
          <p className="text-text-light text-sm mt-1">Inventory & Invoicing System v2.0</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl transition duration-200 font-medium shadow-lg shadow-blue-200"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-slate-400">
          Demo Credentials:
          <div className="mt-2 space-y-1">
            <button onClick={() => { setUsername('admin@hydraulic.com'); setPassword('admin123'); }} className="block w-full text-left px-2 py-1 hover:bg-slate-50 rounded">admin@hydraulic.com / admin123</button>
            <button onClick={() => { setUsername('john@hydraulic.com'); setPassword('sales123'); }} className="block w-full text-left px-2 py-1 hover:bg-slate-50 rounded">john@hydraulic.com / sales123</button>
            <button onClick={() => { setUsername('mike@hydraulic.com'); setPassword('tech123'); }} className="block w-full text-left px-2 py-1 hover:bg-slate-50 rounded">mike@hydraulic.com / tech123</button>
            <button onClick={() => { setUsername('sarah@hydraulic.com'); setPassword('viewer123'); }} className="block w-full text-left px-2 py-1 hover:bg-slate-50 rounded">sarah@hydraulic.com / viewer123</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP COMPONENT
// ============================================================

const App: React.FC = () => {
  // ===== STATE =====
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [invoices, setInvoices] = useState<Invoice[]>(generateSampleInvoices);
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'builder' | 'invoicing' | 'reports' | 'settings'>('dashboard');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState<Invoice[]>([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showNotification, setShowNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);

  // ===== PERMISSIONS =====
  const currentPermissions = useMemo(() => {
    if (!currentUser) return defaultPermissions.viewer;
    return currentUser.permissions || defaultPermissions[currentUser.role];
  }, [currentUser]);

  // ===== COMPUTED VALUES =====
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.quantity <= item.reorderThreshold);
  }, [inventory]);

  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  }, [inventory]);

  const totalSales = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  const filteredInventory = useMemo(() => {
    let items = inventory;
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specs.sae?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specs.threadType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterType !== 'all') {
      items = items.filter(item => item.type === filterType);
    }
    return items;
  }, [inventory, searchQuery, filterType]);

  // Monthly data for charts
  const getMonthlyData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((_, index) => {
      const monthInvoices = invoices.filter(inv => new Date(inv.date).getMonth() === index);
      return monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    });
    return { labels: months, values: data };
  }, [invoices]);

  const getPaymentMethodData = useCallback(() => {
    const methods = ['Cash', 'MoMo', 'Bank', 'Credit'];
    const data = methods.map(method => {
      return invoices.filter(inv => inv.paymentMethod === method).reduce((sum, inv) => sum + inv.total, 0);
    });
    return { labels: methods, values: data };
  }, [invoices]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (lowStockItems.length > 0) {
      setShowLowStockAlert(true);
    }
  }, [lowStockItems]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (pendingSync.length > 0) {
        setTimeout(() => {
          setInvoices(prev => [...prev, ...pendingSync]);
          setPendingSync([]);
          showNotificationMessage(`Synced ${pendingSync.length} offline invoices!`, 'success');
        }, 1000);
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      showNotificationMessage('You are offline. Changes will be saved locally.', 'warning');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync]);

  // ===== HELPER FUNCTIONS =====
  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 4000);
  };

  const logActivity = (action: string, details: string) => {
    if (currentUser) {
      setActivityLogs(prev => [...prev, {
        id: `log-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        action,
        details,
        timestamp: new Date(),
      }]);
    }
  };

  // ===== INVENTORY FUNCTIONS =====
  const updateInventory = (id: string, newQuantity: number) => {
    if (!currentPermissions.canEditInventory) {
      showNotificationMessage('You don\'t have permission to edit inventory', 'error');
      return;
    }
    const item = inventory.find(i => i.id === id);
    if (item) {
      const oldQty = item.quantity;
      setInventory(prev => prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(0, newQuantity), lastUpdated: new Date() } : item
      ));
      logActivity('Stock Update', `Updated ${item.name}: ${oldQty} → ${newQuantity}`);
      showNotificationMessage(`Updated ${item.name} to ${newQuantity}`, 'success');
    }
  };

  const editInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    if (!currentPermissions.canEditInventory) {
      showNotificationMessage('You don\'t have permission to edit inventory', 'error');
      return;
    }
    setInventory(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates, lastUpdated: new Date() } : item
    ));
    const item = inventory.find(i => i.id === id);
    logActivity('Edit Inventory', `Edited ${item?.name}`);
    showNotificationMessage(`Updated ${item?.name} successfully`, 'success');
  };

  const deleteInventoryItem = (id: string) => {
    if (!currentPermissions.canDeleteInventory) {
      showNotificationMessage('You don\'t have permission to delete inventory', 'error');
      return;
    }
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    logActivity('Delete Inventory', `Deleted ${item?.name}`);
    showNotificationMessage(`Deleted ${item?.name}`, 'info');
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    if (!currentPermissions.canEditInventory) {
      showNotificationMessage('You don\'t have permission to add inventory', 'error');
      return;
    }
    const newItem: InventoryItem = {
      ...item,
      id: `item-${Date.now()}`,
      lastUpdated: new Date(),
    };
    setInventory(prev => [...prev, newItem]);
    logActivity('Add Inventory', `Added ${item.name}`);
    showNotificationMessage(`Added ${item.name} to inventory`, 'success');
  };

  const deductComponents = (components: { id: string; quantity: number }[]) => {
    setInventory(prev => prev.map(item => {
      const comp = components.find(c => c.id === item.id);
      if (comp) {
        const newQty = Math.max(0, item.quantity - comp.quantity);
        return { ...item, quantity: newQty, lastUpdated: new Date() };
      }
      return item;
    }));
  };

  // ===== HOSE BUILDER =====
  const buildHoseAssembly = (hoseId: string, fittingId: string, ferruleId: string, length: number, quantity: number = 1) => {
    if (!currentPermissions.canBuildAssembly) {
      showNotificationMessage('You don\'t have permission to build assemblies', 'error');
      return;
    }
    const hose = inventory.find(i => i.id === hoseId);
    const fitting = inventory.find(i => i.id === fittingId);
    const ferrule = inventory.find(i => i.id === ferruleId);

    if (!hose || !fitting || !ferrule) {
      showNotificationMessage('Missing components for assembly', 'error');
      return;
    }

    const totalHose = length * quantity;
    const totalFittings = 2 * quantity;
    const totalFerrules = 2 * quantity;

    if (hose.quantity < totalHose || fitting.quantity < totalFittings || ferrule.quantity < totalFerrules) {
      showNotificationMessage('Insufficient stock for assembly', 'error');
      return;
    }

    deductComponents([
      { id: hoseId, quantity: totalHose },
      { id: fittingId, quantity: totalFittings },
      { id: ferruleId, quantity: totalFerrules },
    ]);

    const assembly: InventoryItem = {
      id: `asm-${Date.now()}`,
      name: `Hose Assembly (${hose.name} + ${fitting.name})`,
      type: 'assembly',
      unit: 'pieces',
      quantity: quantity,
      specs: { 
        ...hose.specs, 
        ...fitting.specs,
        assemblyLength: length,
      },
      reorderThreshold: 0,
      cost: (hose.cost * length + fitting.cost * 2 + ferrule.cost * 2) * quantity,
      price: (hose.price * length + fitting.price * 2 + ferrule.price * 2 + 5) * quantity,
      location: 'Assembly Area',
      supplier: 'In-House',
      lastUpdated: new Date()
    };

    setInventory(prev => [...prev, assembly]);
    logActivity('Assembly', `Created ${quantity} ${assembly.name}`);
    showNotificationMessage(`Created ${quantity} hose assembly(ies) successfully!`, 'success');
  };

  // ===== INVOICING FUNCTIONS =====
  const createInvoice = (
    customer: string,
    items: InvoiceItem[],
    paymentMethod: 'Cash' | 'MoMo' | 'Bank' | 'Credit',
    momoId?: string,
    customerEmail?: string,
    customerPhone?: string,
    notes?: string
  ) => {
    if (!currentPermissions.canCreateInvoice) {
      showNotificationMessage('You don\'t have permission to create invoices', 'error');
      return;
    }
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const netSubtotal = subtotal - discountTotal;
    const vat = netSubtotal * (systemSettings.taxRate / 100);
    const nhil = netSubtotal * (systemSettings.nhilRate / 100);
    const getfund = netSubtotal * (systemSettings.getfundRate / 100);
    const covidLevy = netSubtotal * (systemSettings.covidLevyRate / 100);
    const total = netSubtotal + vat + nhil + getfund + covidLevy;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `${systemSettings.invoicePrefix}${String(invoices.length + 1).padStart(4, '0')}`,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customer,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discountTotal,
      vat,
      nhil,
      getfund,
      covidLevy,
      total,
      paymentMethod,
      momoTransactionId: momoId,
      paymentStatus: paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
      amountPaid: paymentMethod === 'Credit' ? 0 : total,
      status: 'invoiced',
      notes,
      terms: systemSettings.defaultPaymentTerms,
    };

    if (isOffline && systemSettings.enableOfflineMode) {
      setPendingSync(prev => [...prev, newInvoice]);
      showNotificationMessage('Invoice saved offline. Will sync when online.', 'warning');
    } else {
      setInvoices(prev => [...prev, newInvoice]);
      logActivity('Invoice Created', `Created invoice ${newInvoice.number} for ${customer}`);
      showNotificationMessage(`Invoice ${newInvoice.number} created successfully!`, 'success');
    }
  };

  const convertQuoteToInvoice = (quoteId: string) => {
    if (!currentPermissions.canEditInvoice) {
      showNotificationMessage('You don\'t have permission to convert quotes', 'error');
      return;
    }
    setInvoices(prev => prev.map(inv =>
      inv.id === quoteId ? { ...inv, status: 'invoiced', date: new Date() } : inv
    ));
    logActivity('Quote Converted', `Converted quote ${quoteId} to invoice`);
    showNotificationMessage('Quote converted to Invoice successfully', 'success');
  };

  const cancelInvoice = (invoiceId: string) => {
    if (!currentPermissions.canDeleteInvoice) {
      showNotificationMessage('You don\'t have permission to cancel invoices', 'error');
      return;
    }
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv
    ));
    logActivity('Invoice Cancelled', `Cancelled invoice ${invoiceId}`);
    showNotificationMessage('Invoice cancelled', 'info');
  };

  // ===== USER MANAGEMENT FUNCTIONS =====
  const addUser = (userData: Omit<User, 'id'>) => {
    if (!currentPermissions.canManageUsers) {
      showNotificationMessage('You don\'t have permission to manage users', 'error');
      return;
    }
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`,
      permissions: defaultPermissions[userData.role],
      lastLogin: undefined,
    };
    setUsers(prev => [...prev, newUser]);
    logActivity('Add User', `Added user ${userData.name}`);
    showNotificationMessage(`User ${userData.name} added successfully`, 'success');
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    if (!currentPermissions.canManageUsers) {
      showNotificationMessage('You don\'t have permission to manage users', 'error');
      return;
    }
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    ));
    const user = users.find(u => u.id === userId);
    logActivity('Update User', `Updated user ${user?.name}`);
    showNotificationMessage(`User updated successfully`, 'success');
  };

  const deleteUser = (userId: string) => {
    if (!currentPermissions.canManageUsers) {
      showNotificationMessage('You don\'t have permission to manage users', 'error');
      return;
    }
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('Delete User', `Deleted user ${user?.name}`);
    showNotificationMessage(`User ${user?.name} deleted`, 'info');
  };

  // ===== SYSTEM SETTINGS FUNCTIONS =====
  const updateSystemSettings = (settings: Partial<SystemSettings>) => {
    if (!currentPermissions.canManageSettings) {
      showNotificationMessage('You don\'t have permission to manage settings', 'error');
      return;
    }
    setSystemSettings(prev => ({ ...prev, ...settings }));
    logActivity('Update Settings', `Updated system settings`);
    showNotificationMessage('Settings updated successfully', 'success');
  };

  // ===== REPORT FUNCTIONS =====
  const generateDailyReport = useCallback(() => {
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter(inv => 
      new Date(inv.date).toDateString() === today && inv.status !== 'cancelled'
    );
    const totalRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paymentMethods = {
      Cash: todayInvoices.filter(inv => inv.paymentMethod === 'Cash').reduce((s, i) => s + i.total, 0),
      MoMo: todayInvoices.filter(inv => inv.paymentMethod === 'MoMo').reduce((s, i) => s + i.total, 0),
      Bank: todayInvoices.filter(inv => inv.paymentMethod === 'Bank').reduce((s, i) => s + i.total, 0),
      Credit: todayInvoices.filter(inv => inv.paymentMethod === 'Credit').reduce((s, i) => s + i.total, 0),
    };
    const topItems = todayInvoices.flatMap(inv => inv.items).reduce((acc, item) => {
      acc[item.description] = (acc[item.description] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);
    const topSelling = Object.entries(topItems).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { 
      totalRevenue, 
      paymentMethods, 
      invoiceCount: todayInvoices.length,
      topSelling,
      date: new Date().toLocaleDateString()
    };
  }, [invoices]);

  const generateStockMovement = useCallback(() => {
    return inventory
      .filter(item => item.type !== 'assembly')
      .map(item => ({
        ...item,
        movement: Math.floor(Math.random() * 50) + 1,
        turnover: (Math.random() * 5 + 0.5).toFixed(1)
      }))
      .sort((a, b) => b.movement - a.movement)
      .slice(0, 10);
  }, [inventory]);

  const generateProfitLoss = useCallback(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCOGS = invoices.flatMap(inv => inv.items).reduce((sum, item) => {
      const invItem = inventory.find(i => i.name === item.description);
      return sum + (invItem ? invItem.cost * item.quantity : 0);
    }, 0);
    return {
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit: totalRevenue - totalCOGS,
      margin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue * 100) : 0,
      taxLiability: totalRevenue * (systemSettings.taxRate / 100),
    };
  }, [invoices, inventory, systemSettings.taxRate]);

  // ===== HANDLE LOGIN =====
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    logActivity('Login', 'User logged in');
  };

  // ===== MAIN RENDER =====
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notification */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3.5 rounded-2xl shadow-2xl transition-all transform translate-y-0 backdrop-blur-sm ${
          showNotification.type === 'success' ? 'bg-emerald-500' :
          showNotification.type === 'error' ? 'bg-red-500' :
          showNotification.type === 'warning' ? 'bg-amber-500' :
          'bg-blue-500'
        } text-white font-medium`}>
          {showNotification.message}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <span className="text-white text-lg">🔧</span>
          </div>
          <div>
            <span className="text-xl font-bold text-text">HMS</span>
            <span className="text-sm text-slate-400 ml-2 hidden md:inline">| Hydraulic Management System</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-light hidden md:inline">
            {currentUser?.name} 
            <span className="text-slate-400 ml-1">({currentUser?.role})</span>
          </span>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-200">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <button
            className="text-slate-400 hover:text-text-light p-2 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => {
              logActivity('Logout', 'User logged out');
              setCurrentUser(null);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur-md shadow-sm min-h-[calc(100vh-64px)] p-4 sticky top-16 border-r border-slate-100">
          <nav className="space-y-1">
            <button
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="text-xl">📊</span>
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'inventory' 
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 shadow-sm border border-amber-100' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('inventory')}
            >
              <span className="text-xl">📦</span>
              <span className="font-medium">Inventory</span>
              {lowStockItems.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'builder' 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('builder')}
            >
              <span className="text-xl">🔧</span>
              <span className="font-medium">Hose Builder</span>
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'invoicing' 
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-100' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('invoicing')}
            >
              <span className="text-xl">📄</span>
              <span className="font-medium">Invoicing</span>
              {invoices.filter(i => i.status === 'quoted').length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                  {invoices.filter(i => i.status === 'quoted').length}
                </span>
              )}
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'reports' 
                  ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 shadow-sm border border-rose-100' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="text-xl">📈</span>
              <span className="font-medium">Reports</span>
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'settings' 
                  ? 'bg-gradient-to-r from-slate-50 to-slate-100 text-text shadow-sm border border-slate-200' 
                  : 'text-text-light hover:bg-slate-50'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="text-xl">⚙️</span>
              <span className="font-medium">Settings</span>
            </button>
          </nav>
          <div className="border-t border-slate-100 mt-4 pt-4">
            <div className="text-xs text-slate-400 space-y-1">
              <div>Version 2.0.0</div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {isOffline ? 'Offline' : 'Online'}
              </div>
              <div className="text-slate-300 text-[10px]">Role: {currentUser?.role}</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              inventory={inventory}
              invoices={invoices}
              lowStockItems={lowStockItems}
              totalInventoryValue={totalInventoryValue}
              totalSales={totalSales}
              isOffline={isOffline}
              showLowStockAlert={showLowStockAlert}
              setShowLowStockAlert={setShowLowStockAlert}
              setActiveTab={setActiveTab}
              generateDailyReport={generateDailyReport}
              generateStockMovement={generateStockMovement}
              generateProfitLoss={generateProfitLoss}
              getMonthlyData={getMonthlyData}
              getPaymentMethodData={getPaymentMethodData}
            />
          )}
          {activeTab === 'inventory' && (
            <Inventory
              inventory={inventory}
              filteredInventory={filteredInventory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              updateInventory={updateInventory}
              editInventoryItem={editInventoryItem}
              deleteInventoryItem={deleteInventoryItem}
              addInventoryItem={addInventoryItem}
              permissions={currentPermissions}
              currentUser={currentUser}
            />
          )}
          {activeTab === 'builder' && (
            <HoseBuilder
              inventory={inventory}
              buildHoseAssembly={buildHoseAssembly}
              setActiveTab={setActiveTab}
              showNotificationMessage={showNotificationMessage}
            />
          )}
          {activeTab === 'invoicing' && (
            <Invoicing
              invoices={invoices}
              inventory={inventory}
              systemSettings={systemSettings}
              customers={customers}
              totalSales={totalSales}
              createInvoice={createInvoice}
              convertQuoteToInvoice={convertQuoteToInvoice}
              cancelInvoice={cancelInvoice}
              showNotificationMessage={showNotificationMessage}
            />
          )}
          {activeTab === 'reports' && (
            <Reports
              generateDailyReport={generateDailyReport}
              generateStockMovement={generateStockMovement}
              generateProfitLoss={generateProfitLoss}
              getMonthlyData={getMonthlyData}
              getPaymentMethodData={getPaymentMethodData}
              invoices={invoices}
            />
          )}
          {activeTab === 'settings' && (
            <Settings
              currentUser={currentUser}
              isOffline={isOffline}
              pendingSync={pendingSync}
              activityLogs={activityLogs}
              users={users}
              systemSettings={systemSettings}
              updateUser={updateUser}
              setPendingSync={setPendingSync}
              setInvoices={setInvoices}
              addUser={addUser}
              deleteUser={deleteUser}
              updateSystemSettings={updateSystemSettings}
              showNotificationMessage={showNotificationMessage}
              permissions={currentPermissions}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;