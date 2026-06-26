import React, { useState, useEffect, useCallback } from "react";
import { Button, Input } from "../../components/common";
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Percent,
  FileText,
  Shield,
  Key,
  EyeOff,
  Eye,
  Palette,
  Sun,
  Moon,
  Monitor,
  Database,
  Download,
  Save,
  HardDrive,
  ChevronRight,
  CheckSquare,
  Package,
  Receipt,
  Square,
  Truck,
  Users,
} from "lucide-react";
import Switch from "../../components/common/Switch";
import { useTheme } from "../../core/contexts/ThemeProvider";
import { useStore } from "../../core/contexts/StoreProvider";
import { toast } from "sonner";
import EntityService from "../../core/services/entity";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import authServiceInstance from "../../core/services/auth";
import inventoryServiceInstance from "../../core/services/inventory";
import invoiceServiceInstance from "../../core/services/invoice";
import customerServiceInstance from "../../core/services/customer";
import supplierServiceInstance from "../../core/services/supplier";
import * as XLSX from 'xlsx';

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  tax_id: string;
  currency: string;
  registration_number: string;
  website: string;
}

interface BackupSelection {
  inventory: boolean;
  invoices: boolean;
  customers: boolean;
  suppliers: boolean;
}


interface TaxSettings {
  vat: number;
  nhil: number;
  getfund: number;
  covid_levy: number;
  vat_enabled: boolean;
  nhil_enabled: boolean;
  getfund_enabled: boolean;
  covid_levy_enabled: boolean;
}

interface InvoiceSettings {
  prefix: string;
  footer_text: string;
  watermark: string;
}

const TABS = [
  {
    id: "company",
    label: "Company",
    icon: Building,
    description: "Name, contact & legal details",
  },
  {
    id: "tax",
    label: "Tax",
    icon: Percent,
    description: "Rates and levy configuration",
  },
  {
    id: "invoice",
    label: "Invoices",
    icon: FileText,
    description: "Prefix, footer & watermarks",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password & access control",
  },
  {
    id: "system",
    label: "System",
    icon: Database,
    description: "Theme & data management",
  },
];

/* ─── Small helpers ───────────────────────────────────────────── */

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, children }) => (
  <div className=" border border-border bg-card overflow-hidden">
    <div className="flex items-start gap-3 px-6 py-4 border-b border-border bg-background/60">
      {icon && (
        <span className="mt-0.5 flex-shrink-0 text-primary">{icon}</span>
      )}
      <div>
        <p className="font-semibold text-text text-sm">{title}</p>
        {subtitle && (
          <p className="text-text-light text-xs mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const FieldGrid: React.FC<{ children: React.ReactNode; cols?: number }> = ({
  children,
  cols = 2,
}) => (
  <div
    className={`grid grid-cols-1 ${
      cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
    } gap-4`}
  >
    {children}
  </div>
);

const TaxRow: React.FC<{
  label: string;
  value: number;
  enabled: boolean;
  onValueChange: (v: number) => void;
  onToggle: (v: boolean) => void;
}> = ({ label, value, enabled, onValueChange, onToggle }) => (
  <div
    className={`flex items-center justify-between gap-4 p-4  border transition-all duration-200 ${
      enabled
        ? "border-primary/20 bg-primary/5"
        : "border-border bg-background/40 opacity-60"
    }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <Switch checked={enabled} onChange={onToggle} />
      <span className="text-sm font-medium text-text truncate">{label}</span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <input
        type="number"
        value={value}
        disabled={!enabled}
        onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
        min={0}
        max={100}
        step={0.1}
        className="w-20 text-right text-sm font-mono px-2 py-1.5  border border-border bg-card text-text focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      />
      <span className="text-text-light text-sm">%</span>
    </div>
  </div>
);

const ThemeButton: React.FC<{
  id: "light" | "dark" | "system";
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center gap-2 p-4  border-2 transition-all duration-200 ${
      active
        ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
        : "border-border bg-background hover:border-primary/40 hover:bg-primary/3"
    }`}
  >
    <span
      className={`p-2 rounded-full ${active ? "bg-primary/15" : "bg-card"}`}
    >
      {icon}
    </span>
    <span
      className={`text-xs font-semibold ${active ? "text-primary" : "text-text"}`}
    >
      {label}
    </span>
    {active && (
      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
    )}
  </button>
);

/* ─── Main Component ──────────────────────────────────────────── */

const SettingsPage: React.FC = () => {

// Helper function to flatten objects for Excel export
const flattenObject = (obj: any, prefix = ''): any => {
  const flattened: any = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
};

// Helper to convert array of objects to Excel-friendly format
const prepareDataForExcel = (data: any[]): any[] => {
  if (!data || data.length === 0) return [];
  
  // Check if data has nested objects, flatten if needed
  const hasNestedObjects = data.some(item => 
    Object.values(item).some(val => val && typeof val === 'object' && !Array.isArray(val))
  );
  
  if (hasNestedObjects) {
    return data.map(item => flattenObject(item));
  }
  
  return data;
};

  const { theme, setTheme, resolvedTheme } = useTheme();
  const { entity, setEntity } = useStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  // const [isRestoring, setIsRestoring] = useState(false);
  usePageTitle("Settings");

  // Backup selection state
  const [backupSelection, setBackupSelection] = useState<BackupSelection>({
    inventory: true,
    invoices: true,
    customers: true,
    suppliers: true,
  });

  // Company Settings
  const [company, setCompany] = useState<CompanySettings>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    tax_id: "",
    currency: "GHS",
    registration_number: "",
    website: "",
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    vat: 12.5,
    nhil: 2.5,
    getfund: 2.5,
    covid_levy: 1.0,
    vat_enabled: true,
    nhil_enabled: true,
    getfund_enabled: true,
    covid_levy_enabled: true,
  });

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: "INV",
    footer_text: "Thank you for your business!",
    watermark: "PAID",
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Load entity data
  useEffect(() => {
    if (entity) {
      setCompany({
        name: entity.name || "",
        email: entity.email || "",
        phone: entity.phone || "",
        address: entity.address || "",
        city: entity.city || "",
        state: entity.state || "",
        country: entity.country || "",
        zip_code: entity.zip_code || "",
        tax_id: entity.tax_id || "",
        currency: entity.currency || "GHS",
        registration_number: entity.registration_number || "",
        website: entity.website || "",
      });

      if (entity.metadata) {
        const meta = entity.metadata;
        setTaxSettings({
          vat: meta.vat || 0,
          nhil: meta.nhil || 0,
          getfund: meta.getfund || 0,
          covid_levy: meta.covid_levy || 0,
          vat_enabled: meta.vat_enabled !== false,
          nhil_enabled: meta.nhil_enabled !== false,
          getfund_enabled: meta.getfund_enabled !== false,
          covid_levy_enabled: meta.covid_levy_enabled !== false,
        });
        setInvoiceSettings({
          prefix: meta.invoice_prefix || "",
          footer_text:
            meta.invoice_footer_text || "Thank you for your business!",
          watermark: meta.invoice_watermark || "",
        });
      }
    }
  }, [entity]);

  // Handle company settings change
  const handleCompanyChange = (field: keyof CompanySettings, value: any) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  // Handle tax settings change
  const handleTaxChange = (field: keyof TaxSettings, value: any) => {
    setTaxSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Handle invoice settings change
  const handleInvoiceChange = (field: keyof InvoiceSettings, value: any) => {
    setInvoiceSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Save all settings
  const handleSaveAll = useCallback(async () => {
    if (!entity?.uuid) {
      toast.error("Error", { description: "No entity selected" });
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        zip_code: company.zip_code || "",
        tax_id: company.tax_id || "",
        currency: company.currency || "GHS",
        registration_number: company.registration_number || "",
        website: company.website || "",
        metadata: {
          vat: taxSettings.vat || 0,
          nhil: taxSettings.nhil || 0,
          getfund: taxSettings.getfund || 0,
          covid_levy: taxSettings.covid_levy || 0,
          vat_enabled: taxSettings.vat_enabled,
          nhil_enabled: taxSettings.nhil_enabled,
          getfund_enabled: taxSettings.getfund_enabled,
          covid_levy_enabled: taxSettings.covid_levy_enabled,
          prefix: invoiceSettings.prefix || "",
          invoice_prefix: invoiceSettings.prefix || "",
          footer_text: invoiceSettings.footer_text || "",
          invoice_footer_text: invoiceSettings.footer_text || "",
          watermark: invoiceSettings.watermark || "",
          invoice_watermark: invoiceSettings.watermark || "",
        },
      };

      const response = await EntityService.updateEntity(
        entity.uuid,
        updateData,
      );

      if (response.success) {
        const updatedEntity = response.results;
        if (updatedEntity) {
          setEntity(updatedEntity);

          if (updatedEntity.metadata) {
            const meta = updatedEntity.metadata;
            setTaxSettings({
              vat: meta.vat || 0,
              nhil: meta.nhil || 0,
              getfund: meta.getfund || 0,
              covid_levy: meta.covid_levy || 0,
              vat_enabled: meta.vat_enabled !== undefined ? meta.vat_enabled : true,
              nhil_enabled: meta.nhil_enabled !== undefined ? meta.nhil_enabled : true,
              getfund_enabled: meta.getfund_enabled !== undefined ? meta.getfund_enabled : true,
              covid_levy_enabled: meta.covid_levy_enabled !== undefined ? meta.covid_levy_enabled : true,
            });
            setInvoiceSettings({
              prefix: meta.prefix || meta.invoice_prefix || "",
              footer_text: meta.footer_text || meta.invoice_footer_text || "",
              watermark: meta.watermark || meta.invoice_watermark || "",
            });
          }
        }

        toast.success("Success", {
          description: "Settings saved successfully!",
        });
      } else {
        throw new Error(response.message || "Failed to save settings");
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  }, [entity, setEntity, company, taxSettings, invoiceSettings]);

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Error", { description: "Passwords do not match" });
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error("Error", {
        description: "Password must be at least 8 characters",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authServiceInstance.changePassword(passwordData);
      if(response.success){
      toast.success("Success", {
        description: "Password changed successfully!",
      });

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Data Fetching Functions ──────────────────────────────────────────────

  const fetchAllInventory = async () => {
    try {
      let allItems: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await inventoryServiceInstance.getItems({ page, limit });
        if (response.success && response.results) {
          allItems = [...allItems, ...response.results];
          const total = response.count || 0;
          hasMore = allItems.length < total;
          page++;
        } else {
          hasMore = false;
        }
      }
      return allItems;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  };

  const fetchAllInvoices = async () => {
    try {
      let allItems: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await invoiceServiceInstance.getInvoices({ page, limit });
        if (response.success && response.results) {
          allItems = [...allItems, ...response.results];
          const total = response.count || 0;
          hasMore = allItems.length < total;
          page++;
        } else {
          hasMore = false;
        }
      }
      return allItems;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  };

  const fetchAllCustomers = async () => {
    try {
      let allItems: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await customerServiceInstance.getCustomers({ page, limit });
        if (response.success && response.results) {
          allItems = [...allItems, ...response.results];
          const total = response.count || 0;
          hasMore = allItems.length < total;
          page++;
        } else {
          hasMore = false;
        }
      }
      return allItems;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  };

  const fetchAllSuppliers = async () => {
    try {
      let allItems: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await supplierServiceInstance.getSuppliers({ page, limit });
        if (response.success && response.results) {
          allItems = [...allItems, ...response.results];
          const total = response.count || 0;
          hasMore = allItems.length < total;
          page++;
        } else {
          hasMore = false;
        }
      }
      return allItems;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  };

  // ── Excel Export Functions ──────────────────────────────────────────────

  const exportToExcel = (data: any[], sheetName: string, fileName: string) => {
    if (!data || data.length === 0) {
      toast.warning("Warning", {
        description: `No data available for ${sheetName}`,
      });
      return null;
    }

    try {
      // Prepare data for Excel
      const excelData = prepareDataForExcel(data);
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns (optional)
      const colWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.max(key.length, 12)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      return blob;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error("Error", {
        description: `Failed to export ${sheetName} to Excel`,
      });
      return null;
    }
  };

  // ── Backup Functions ──────────────────────────────────────────────────────

  const getSelectedModules = () => {
    const modules: { name: string; key: keyof BackupSelection; fetchFn: () => Promise<any[]> }[] = [];
    
    if (backupSelection.inventory) {
      modules.push({ name: 'Inventory', key: 'inventory', fetchFn: fetchAllInventory });
    }
    if (backupSelection.invoices) {
      modules.push({ name: 'Invoices', key: 'invoices', fetchFn: fetchAllInvoices });
    }
    if (backupSelection.customers) {
      modules.push({ name: 'Customers', key: 'customers', fetchFn: fetchAllCustomers });
    }
    if (backupSelection.suppliers) {
      modules.push({ name: 'Suppliers', key: 'suppliers', fetchFn: fetchAllSuppliers });
    }
    
    return modules;
  };

  // Check if the browser supports the File System Access API
  const isFileSystemAccessSupported = () => {
    return typeof (window as any).showDirectoryPicker === 'function';
  };

  // Download Excel file to browser
  // const downloadExcelFile = (blob: Blob, fileName: string) => {
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = fileName;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);
  // };

  // Backup data to USB drive as Excel
  const handleBackupToUSB = async () => {
    if (!isFileSystemAccessSupported()) {
      toast.error("Error", {
        description: "Your browser doesn't support direct USB access. Please use Chrome or Edge.",
      });
      return;
    }

    const selectedModules = getSelectedModules();
    if (selectedModules.length === 0) {
      toast.warning("Warning", {
        description: "Please select at least one module to backup.",
      });
      return;
    }

    try {
      setIsBackingUp(true);
      setBackupProgress(0);

      // Show directory picker to select USB drive
      const directoryHandle = await (window as any).showDirectoryPicker();
      
      toast.info("Info", {
        description: `Selected folder: ${directoryHandle.name}`,
      });

      const totalModules = selectedModules.length;
      let completedModules = 0;
      const excelBlobs: { name: string; blob: Blob }[] = [];

      // Fetch and export data for each selected module to Excel
      for (const module of selectedModules) {
        try {
          toast.info("Info", {
            description: `Fetching ${module.name} data...`,
          });

          const data = await module.fetchFn();
          
          if (data && data.length > 0) {
            const fileName = `${entity?.name || 'company'}_${module.key}_${new Date().toISOString().split('T')[0]}.xlsx`;
            const blob = exportToExcel(data, module.name, fileName);
            
            if (blob) {
              excelBlobs.push({ name: fileName, blob });
              toast.success("Success", {
                description: `Exported ${data.length} ${module.name} records to Excel`,
              });
            }
          } else {
            toast.warning("Warning", {
              description: `No ${module.name} data found to export`,
            });
          }
          
          completedModules++;
          const progress = Math.round((completedModules / totalModules) * 80) + 10;
          setBackupProgress(progress);
          
        } catch (error: any) {
          console.error(`Error fetching/exporting ${module.name}:`, error);
          toast.error("Error", {
            description: `Failed to process ${module.name} data: ${error.message}`,
          });
        }
      }

      // Also export settings as Excel
      try {
        // Export settings as a separate Excel file
        const settingsData = [
          {
            Setting: 'Company Name',
            Value: company.name
          },
          {
            Setting: 'Email',
            Value: company.email
          },
          {
            Setting: 'Phone',
            Value: company.phone
          },
          {
            Setting: 'Address',
            Value: `${company.address}, ${company.city}, ${company.state}, ${company.country}`
          },
          {
            Setting: 'Currency',
            Value: company.currency
          },
          {
            Setting: 'VAT Rate',
            Value: `${taxSettings.vat}%`
          },
          {
            Setting: 'NHIL Rate',
            Value: `${taxSettings.nhil}%`
          },
          {
            Setting: 'GETFund Rate',
            Value: `${taxSettings.getfund}%`
          },
          {
            Setting: 'COVID-19 Levy',
            Value: `${taxSettings.covid_levy}%`
          },
          {
            Setting: 'Invoice Prefix',
            Value: invoiceSettings.prefix
          },
          {
            Setting: 'Invoice Footer',
            Value: invoiceSettings.footer_text
          },
          {
            Setting: 'Watermark',
            Value: invoiceSettings.watermark
          },
          {
            Setting: 'Tax ID',
            Value: company.tax_id
          },
          {
            Setting: 'Registration Number',
            Value: company.registration_number
          },
          {
            Setting: 'Website',
            Value: company.website
          }
        ];

        const settingsFileName = `${entity?.name || 'company'}_settings_${new Date().toISOString().split('T')[0]}.xlsx`;
        const settingsBlob = exportToExcel(settingsData, 'Settings', settingsFileName);
        if (settingsBlob) {
          excelBlobs.push({ name: settingsFileName, blob: settingsBlob });
        }
      } catch (error) {
        console.error('Error exporting settings:', error);
        toast.error("Error", {
          description: 'Failed to export settings to Excel',
        });
      }

      setBackupProgress(90);

      // Save Excel files to USB
      let savedFiles = 0;
      for (const { name, blob } of excelBlobs) {
        try {
          const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          savedFiles++;
        } catch (error) {
          console.error(`Error saving ${name}:`, error);
          toast.error("Error", {
            description: `Failed to save ${name} to USB`,
          });
        }
      }

      setBackupProgress(100);

      toast.success("Success", {
        description: `Successfully saved ${savedFiles} Excel files to ${directoryHandle.name}/`,
        duration: 6000,
      });

    } catch (error: any) {
      if (error.message?.includes('abort') || error.name === 'AbortError') {
        toast.info("Info", { description: "Backup cancelled" });
      } else {
        console.error('Backup error:', error);
        toast.error("Error", {
          description: error.message || "Failed to backup data to USB drive",
        });
      }
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupProgress(0), 3000);
    }
  };

  // // Download backup as Excel files (alternative to USB)
  // const handleDownloadBackup = async () => {
  //   const selectedModules = getSelectedModules();
  //   if (selectedModules.length === 0) {
  //     toast.warning("Warning", {
  //       description: "Please select at least one module to backup.",
  //     });
  //     return;
  //   }

  //   setIsBackingUp(true);
  //   setBackupProgress(0);

  //   try {
  //     let downloadedFiles = 0;
  //     const totalModules = selectedModules.length;

  //     for (const module of selectedModules) {
  //       try {
  //         toast.info("Info", {
  //           description: `Fetching ${module.name} data...`,
  //         });

  //         const data = await module.fetchFn();
          
  //         if (data && data.length > 0) {
  //           const fileName = `${entity?.name || 'company'}_${module.key}_${new Date().toISOString().split('T')[0]}.xlsx`;
  //           const blob = exportToExcel(data, module.name, fileName);
            
  //           if (blob) {
  //             downloadExcelFile(blob, fileName);
  //             downloadedFiles++;
  //             toast.success("Success", {
  //               description: `Downloaded ${data.length} ${module.name} records`,
  //             });
  //           }
  //         } else {
  //           toast.warning("Warning", {
  //             description: `No ${module.name} data found to export`,
  //           });
  //         }
          
  //         const progress = Math.round(((downloadedFiles) / totalModules) * 80) + 10;
  //         setBackupProgress(progress);
          
  //       } catch (error: any) {
  //         console.error(`Error processing ${module.name}:`, error);
  //         toast.error("Error", {
  //           description: `Failed to process ${module.name} data: ${error.message}`,
  //         });
  //       }
  //     }

  //     // Export settings as Excel
  //     try {
  //       const settingsData = [
  //         { Setting: 'Company Name', Value: company.name },
  //         { Setting: 'Email', Value: company.email },
  //         { Setting: 'Phone', Value: company.phone },
  //         { Setting: 'Address', Value: `${company.address}, ${company.city}, ${company.state}, ${company.country}` },
  //         { Setting: 'Currency', Value: company.currency },
  //         { Setting: 'VAT Rate', Value: `${taxSettings.vat}%` },
  //         { Setting: 'NHIL Rate', Value: `${taxSettings.nhil}%` },
  //         { Setting: 'GETFund Rate', Value: `${taxSettings.getfund}%` },
  //         { Setting: 'COVID-19 Levy', Value: `${taxSettings.covid_levy}%` },
  //         { Setting: 'Invoice Prefix', Value: invoiceSettings.prefix },
  //         { Setting: 'Invoice Footer', Value: invoiceSettings.footer_text },
  //         { Setting: 'Watermark', Value: invoiceSettings.watermark },
  //         { Setting: 'Tax ID', Value: company.tax_id },
  //         { Setting: 'Registration Number', Value: company.registration_number },
  //         { Setting: 'Website', Value: company.website }
  //       ];

  //       const settingsFileName = `${entity?.name || 'company'}_settings_${new Date().toISOString().split('T')[0]}.xlsx`;
  //       const settingsBlob = exportToExcel(settingsData, 'Settings', settingsFileName);
  //       if (settingsBlob) {
  //         downloadExcelFile(settingsBlob, settingsFileName);
  //         downloadedFiles++;
  //       }
  //     } catch (error) {
  //       console.error('Error exporting settings:', error);
  //     }

  //     setBackupProgress(100);

  //     toast.success("Success", {
  //       description: `Downloaded ${downloadedFiles} Excel files`,
  //       duration: 4000,
  //     });

  //   } catch (error: any) {
  //     console.error('Download backup error:', error);
  //     toast.error("Error", {
  //       description: error.message || "Failed to download backup",
  //     });
  //   } finally {
  //     setIsBackingUp(false);
  //     setTimeout(() => setBackupProgress(0), 3000);
  //   }
  // };

  // // Restore data from USB drive - NOTE: This now only restores settings since Excel doesn't support direct data restoration
  // const handleRestoreFromUSB = async () => {
  //   if (!isFileSystemAccessSupported()) {
  //     toast.error("Error", {
  //       description: "Your browser doesn't support direct USB access. Please use Chrome or Edge.",
  //     });
  //     return;
  //   }

  //   try {
  //     setIsRestoring(true);

  //     // Show file picker to select backup file
  //     const [fileHandle] = await (window as any).showOpenFilePicker({
  //       types: [
  //         {
  //           description: 'Excel Files',
  //           accept: { 
  //             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  //             'application/vnd.ms-excel': ['.xls']
  //           },
  //         },
  //       ],
  //       multiple: false,
  //     });

  //     const file = await fileHandle.getFile();
      
  //     // Read Excel file
  //     const arrayBuffer = await file.arrayBuffer();
  //     const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
  //     // Get first sheet
  //     const firstSheetName = workbook.SheetNames[0];
  //     const worksheet = workbook.Sheets[firstSheetName];
      
  //     // Convert to JSON
  //     const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
  //     if (!jsonData || jsonData.length === 0) {
  //       throw new Error("No data found in the Excel file");
  //     }

  //     toast.info("Info", {
  //       description: `Processing settings from ${file.name}`,
  //     });

  //     // Try to extract settings from the Excel file
  //     let settingsFound = false;
  //     const settings: any = {};

  //     jsonData.forEach((row: any) => {
  //       if (row.Setting && row.Value !== undefined) {
  //         settings[row.Setting] = row.Value;
  //       }
  //     });

  //     // Update company settings if found
  //     if (settings['Company Name']) {
  //       setCompany(prev => ({ ...prev, name: settings['Company Name'] }));
  //       settingsFound = true;
  //     }
  //     if (settings['Email']) {
  //       setCompany(prev => ({ ...prev, email: settings['Email'] }));
  //       settingsFound = true;
  //     }
  //     if (settings['Phone']) {
  //       setCompany(prev => ({ ...prev, phone: settings['Phone'] }));
  //       settingsFound = true;
  //     }
  //     if (settings['Currency']) {
  //       setCompany(prev => ({ ...prev, currency: settings['Currency'] }));
  //       settingsFound = true;
  //     }
      
  //     // Update tax settings
  //     if (settings['VAT Rate']) {
  //       const vat = parseFloat(settings['VAT Rate']);
  //       if (!isNaN(vat)) {
  //         setTaxSettings(prev => ({ ...prev, vat }));
  //         settingsFound = true;
  //       }
  //     }
  //     if (settings['NHIL Rate']) {
  //       const nhil = parseFloat(settings['NHIL Rate']);
  //       if (!isNaN(nhil)) {
  //         setTaxSettings(prev => ({ ...prev, nhil }));
  //         settingsFound = true;
  //       }
  //     }
  //     if (settings['GETFund Rate']) {
  //       const getfund = parseFloat(settings['GETFund Rate']);
  //       if (!isNaN(getfund)) {
  //         setTaxSettings(prev => ({ ...prev, getfund }));
  //         settingsFound = true;
  //       }
  //     }
  //     if (settings['COVID-19 Levy']) {
  //       const covid_levy = parseFloat(settings['COVID-19 Levy']);
  //       if (!isNaN(covid_levy)) {
  //         setTaxSettings(prev => ({ ...prev, covid_levy }));
  //         settingsFound = true;
  //       }
  //     }

  //     // Update invoice settings
  //     if (settings['Invoice Prefix']) {
  //       setInvoiceSettings(prev => ({ ...prev, prefix: settings['Invoice Prefix'] }));
  //       settingsFound = true;
  //     }
  //     if (settings['Invoice Footer']) {
  //       setInvoiceSettings(prev => ({ ...prev, footer_text: settings['Invoice Footer'] }));
  //       settingsFound = true;
  //     }
  //     if (settings['Watermark']) {
  //       setInvoiceSettings(prev => ({ ...prev, watermark: settings['Watermark'] }));
  //       settingsFound = true;
  //     }

  //     // Update tax IDs
  //     if (settings['Tax ID']) {
  //       setCompany(prev => ({ ...prev, tax_id: settings['Tax ID'] }));
  //       settingsFound = true;
  //     }

  //     if (settingsFound) {
  //       // Save settings automatically
  //       await handleSaveAll();
        
  //       toast.success("Success", {
  //         description: `Settings restored from Excel file successfully!`,
  //         duration: 5000,
  //       });
  //     } else {
  //       toast.warning("Warning", {
  //         description: "No settings found in the Excel file. Make sure it's a valid settings export.",
  //       });
  //     }

  //   } catch (error: any) {
  //     if (error.message?.includes('abort') || error.name === 'AbortError') {
  //       toast.info("Info", { description: "Restore cancelled" });
  //     } else {
  //       console.error('Restore error:', error);
  //       toast.error("Error", {
  //         description: error.message || "Failed to restore settings from USB drive",
  //       });
  //     }
  //   } finally {
  //     setIsRestoring(false);
  //   }
  // };

  // Toggle backup selection
  const toggleBackupSelection = (key: keyof BackupSelection) => {
    setBackupSelection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle all selections
  const toggleAllSelections = () => {
    const allSelected = Object.values(backupSelection).every(v => v);
    setBackupSelection({
      inventory: !allSelected,
      invoices: !allSelected,
      customers: !allSelected,
      suppliers: !allSelected,
    });
  };

  /* ─── Tab Panels ──────────────────────────────────────────────── */

  const renderCompanySettings = () => (
    <div className="space-y-5">
      <SectionCard title="Business Identity" subtitle="Legal name and public-facing details">
        <FieldGrid>
          <Input label="Company Name" value={company.name} onChange={(v: any) => handleCompanyChange("name", v)} prefixIcon={<Building size={14} />} required />
          <Input label="Email Address" type="email" value={company.email} onChange={(v: any) => handleCompanyChange("email", v)} prefixIcon={<Mail size={14} />} required />
          <Input label="Phone Number" value={company.phone} onChange={(v: any) => handleCompanyChange("phone", v)} prefixIcon={<Phone size={14} />} />
          <Input label="Website" value={company.website} onChange={(v: any) => handleCompanyChange("website", v)} prefixIcon={<Globe size={14} />} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Location" subtitle="Registered address for documents and invoices" icon={<MapPin size={15} />}>
        <div className="space-y-4">
          <Input label="Street Address" value={company.address} onChange={(v: any) => handleCompanyChange("address", v)} prefixIcon={<MapPin size={14} />} />
          <FieldGrid>
            <Input label="City" value={company.city} onChange={(v: any) => handleCompanyChange("city", v)} />
            <Input label="State / Region" value={company.state} onChange={(v: any) => handleCompanyChange("state", v)} />
            <Input label="Country" value={company.country} onChange={(v: any) => handleCompanyChange("country", v)} />
            <Input label="ZIP / Postal Code" value={company.zip_code} onChange={(v: any) => handleCompanyChange("zip_code", v)} />
          </FieldGrid>
        </div>
      </SectionCard>

      <SectionCard title="Legal & Finance" subtitle="Registration numbers and base currency">
        <FieldGrid>
          <Input label="Tax ID" value={company.tax_id} onChange={(v: any) => handleCompanyChange("tax_id", v)} />
          <Input label="Registration Number" value={company.registration_number} onChange={(v: any) => handleCompanyChange("registration_number", v)} />
          <div>
            <label className="block text-xs font-medium text-text-light mb-1.5">Currency</label>
            <select
              value={company.currency}
              onChange={(e) => handleCompanyChange("currency", e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-card border border-border  focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text"
            >
              <option value="GHS">Ghana Cedi (GHS)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
              <option value="NGN">Nigerian Naira (NGN)</option>
            </select>
          </div>
        </FieldGrid>
      </SectionCard>
    </div>
  );

  const renderTaxSettings = () => {
    const totalActive = [
      taxSettings.vat_enabled && taxSettings.vat,
      taxSettings.nhil_enabled && taxSettings.nhil,
      taxSettings.getfund_enabled && taxSettings.getfund,
      taxSettings.covid_levy_enabled && taxSettings.covid_levy,
    ]
      .filter(Boolean)
      .reduce((a: number, b) => a + (b as number), 0);

    return (
      <div className="space-y-5">
        {/* Summary pill */}
        <div className="flex items-center justify-between px-5 py-3.5  border border-primary/20 bg-primary/5">
          <span className="text-sm text-text-light">Combined active tax rate</span>
          <span className="text-2xl font-bold font-mono text-primary">
            {totalActive.toFixed(2)}%
          </span>
        </div>

        <SectionCard title="Tax Rates" subtitle="Enable or disable each levy and set its rate" icon={<Percent size={15} />}>
          <div className="space-y-3">
            <TaxRow
              label="VAT — Value Added Tax"
              value={taxSettings.vat}
              enabled={taxSettings.vat_enabled}
              onValueChange={(v) => handleTaxChange("vat", v)}
              onToggle={(v) => handleTaxChange("vat_enabled", v)}
            />
            <TaxRow
              label="NHIL — National Health Insurance Levy"
              value={taxSettings.nhil}
              enabled={taxSettings.nhil_enabled}
              onValueChange={(v) => handleTaxChange("nhil", v)}
              onToggle={(v) => handleTaxChange("nhil_enabled", v)}
            />
            <TaxRow
              label="GETFund Levy"
              value={taxSettings.getfund}
              enabled={taxSettings.getfund_enabled}
              onValueChange={(v) => handleTaxChange("getfund", v)}
              onToggle={(v) => handleTaxChange("getfund_enabled", v)}
            />
            <TaxRow
              label="COVID-19 Levy"
              value={taxSettings.covid_levy}
              enabled={taxSettings.covid_levy_enabled}
              onValueChange={(v) => handleTaxChange("covid_levy", v)}
              onToggle={(v) => handleTaxChange("covid_levy_enabled", v)}
            />
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderInvoiceSettings = () => (
    <div className="space-y-5">
      <SectionCard title="Invoice Format" subtitle="Controls how generated invoices look and are numbered" icon={<FileText size={15} />}>
        <FieldGrid>
          <div>
            <Input
              label="Invoice Prefix"
              value={invoiceSettings.prefix}
              onChange={(v: any) => handleInvoiceChange("prefix", v)}
              prefixIcon={<FileText size={14} />}
              placeholder="INV"
            />
            <p className="text-xs text-text-light mt-1.5">
              Preview: <span className="font-mono text-text">{invoiceSettings.prefix || "INV"}-0001</span>
            </p>
          </div>
          <Input
            label="Watermark Text"
            value={invoiceSettings.watermark}
            onChange={(v: any) => handleInvoiceChange("watermark", v)}
            placeholder="PAID, DRAFT, COPY…"
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Footer" subtitle="Appears at the bottom of every printed invoice">
        <Input
          label="Footer Text"
          type="textarea"
          value={invoiceSettings.footer_text}
          onChange={(v: any) => handleInvoiceChange("footer_text", v)}
          rows={3}
          placeholder="Thank you for your business!"
        />
        {invoiceSettings.footer_text && (
          <div className="mt-4 px-4 py-3  border border-dashed border-border bg-background/60">
            <p className="text-xs text-text-light mb-1 uppercase tracking-wider">Preview</p>
            <p className="text-sm text-text">{invoiceSettings.footer_text}</p>
          </div>
        )}
      </SectionCard>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-5">
      <SectionCard title="Change Password" subtitle="Use a strong password you haven't used elsewhere" icon={<Key size={15} />}>
        <div className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type={showPassword ? "text" : "password"}
            value={passwordData.current_password}
            onChange={(v: any) => setPasswordData((p) => ({ ...p, current_password: v }))}
            suffixIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-light hover:text-text transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={passwordData.new_password}
            onChange={(v: any) => setPasswordData((p) => ({ ...p, new_password: v }))}
          />
          <Input
            label="Confirm New Password"
            type={showPassword ? "text" : "password"}
            value={passwordData.confirm_password}
            onChange={(v: any) => setPasswordData((p) => ({ ...p, confirm_password: v }))}
          />

          {/* Strength hint */}
          {passwordData.new_password && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[8, 12, 16].map((len) => (
                  <div
                    key={len}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      passwordData.new_password.length >= len
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-text-light">
                {passwordData.new_password.length < 8
                  ? "Too short — minimum 8 characters"
                  : passwordData.new_password.length < 12
                  ? "Acceptable — consider adding more characters"
                  : "Strong password"}
              </p>
            </div>
          )}

          <Button onClick={handlePasswordChange} disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </SectionCard>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-5">
      <SectionCard title="Appearance" subtitle="Choose how the interface looks" icon={<Palette size={15} />}>
        <div className="grid grid-cols-3 gap-3">
          <ThemeButton
            id="light"
            label="Light"
            icon={<Sun className={`w-5 h-5 ${theme === "light" ? "text-primary" : "text-yellow-500"}`} />}
            active={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeButton
            id="dark"
            label="Dark"
            icon={<Moon className={`w-5 h-5 ${theme === "dark" ? "text-primary" : "text-slate-400"}`} />}
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
          <ThemeButton
            id="system"
            label="System"
            icon={<Monitor className={`w-5 h-5 ${theme === "system" ? "text-primary" : "text-blue-400"}`} />}
            active={theme === "system"}
            onClick={() => setTheme("system")}
          />
        </div>
        <div className="mt-3 flex items-center justify-between px-4 py-2.5  bg-background border border-border">
          <span className="text-xs text-text-light">Active appearance</span>
          <span className="text-xs font-semibold text-text capitalize">
            {resolvedTheme}
            {theme !== resolvedTheme && (
              <span className="text-text-light font-normal ml-1">via {theme}</span>
            )}
          </span>
        </div>
      </SectionCard>

      <SectionCard title="USB Drive Backup" subtitle="Save or restore your data directly from a USB drive" icon={<HardDrive size={15} />}>
        
         <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text">Select data to backup:</span>
              <button
                onClick={toggleAllSelections}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {Object.values(backupSelection).every(v => v) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => toggleBackupSelection('inventory')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                  backupSelection.inventory
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {backupSelection.inventory ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-text-light" />
                )}
                <Package className="w-5 h-5 text-text-light" />
                <span className="text-sm font-medium text-text">Inventory</span>
              </button>

              <button
                onClick={() => toggleBackupSelection('invoices')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                  backupSelection.invoices
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {backupSelection.invoices ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-text-light" />
                )}
                <Receipt className="w-5 h-5 text-text-light" />
                <span className="text-sm font-medium text-text">Invoices</span>
              </button>

              <button
                onClick={() => toggleBackupSelection('customers')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                  backupSelection.customers
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {backupSelection.customers ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-text-light" />
                )}
                <Users className="w-5 h-5 text-text-light" />
                <span className="text-sm font-medium text-text">Customers</span>
              </button>

              <button
                onClick={() => toggleBackupSelection('suppliers')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                  backupSelection.suppliers
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {backupSelection.suppliers ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-text-light" />
                )}
                <Truck className="w-5 h-5 text-text-light" />
                <span className="text-sm font-medium text-text">Suppliers</span>
              </button>
            </div>
          </div>

        {isBackingUp && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-light">Writing to USB…</span>
              <span className="font-mono font-medium text-text">{backupProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap justity-end gap-3">
          <Button onClick={handleBackupToUSB} disabled={isBackingUp} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Backup to USB
          </Button>
          {/* <Button onClick={handleRestoreFromUSB} disabled={isBackingUp} variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Restore from USB
          </Button> */}
        </div>

        <div className="mt-4 flex items-start gap-2.5 px-4 py-3  bg-info-5 border border-info text-info">
          <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Make sure your USB drive is connected before starting. Backup files are saved as Excel format <span className="font-mono">(.xlsx)</span> and work best in Chrome or Edge.
          </p>
        </div>
      </SectionCard>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "company": return renderCompanySettings();
      case "tax":     return renderTaxSettings();
      case "invoice": return renderInvoiceSettings();
      case "security":return renderSecuritySettings();
      case "system":  return renderSystemSettings();
      default:        return null;
    }
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="h-full bg-background">
      <div className="mx-auto">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text tracking-tight">Settings</h1>
            <p className="text-text-light text-sm mt-0.5">
              Manage your account and application preferences
            </p>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="self-start sm:self-auto flex items-center gap-2 shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* ── Layout: sidebar + content ─────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar nav */}
          <nav className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-6 space-y-1 bg-card border border-border  p-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5  text-left transition-all duration-150 group ${
                      active
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-text-light hover:text-text hover:bg-background"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-text-light group-hover:text-text"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium leading-none ${active ? "text-white" : ""}`}>
                        {tab.label}
                      </p>
                      <p className={`text-xs mt-0.5 truncate ${active ? "text-white/70" : "text-text-light"}`}>
                        {tab.description}
                      </p>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/60 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content pane */}
          <main className="flex-1 min-w-0">
            {/* Section heading */}
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5  bg-primary-5">
                <activeTabMeta.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text leading-none">
                  {activeTabMeta.label}
                </h2>
                <p className="text-xs text-text-light mt-0.5">{activeTabMeta.description}</p>
              </div>
            </div>

            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;