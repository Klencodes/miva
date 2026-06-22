import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Save,
} from "lucide-react";
import Switch from "../../components/common/Switch";
import { useTheme } from "../../core/contexts/ThemeProvider";
import { useStore } from "../../core/contexts/StoreProvider";
import { toast } from "sonner";
import EntityService from "../../core/services/entity"
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

interface TaxSettings {
  tax_rate: number;
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

const SettingsPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { entity, setEntity } = useStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

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
    tax_rate: 12.5,
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

      // Load settings from metadata if available
      if (entity.metadata) {
        const meta = entity.metadata;
        setTaxSettings({
          tax_rate: meta.tax_rate || 0,
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
          footer_text: meta.invoice_footer_text || "Thank you for your business!",
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
  const handleSaveAll = async () => {
    if (!entity?.uuid) {
      toast.error('Error', { description: 'No entity selected' });
      return;
    }

    setSaving(true);


    try {
      // Prepare update data
      const updateData = {
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        zip_code: company.zip_code,
        tax_id: company.tax_id,
        currency: company.currency,
        registration_number: company.registration_number,
        website: company.website,
        metadata: {
          ...taxSettings,
          ...invoiceSettings,
          invoice_prefix: invoiceSettings.prefix,
          invoice_footer_text: invoiceSettings.footer_text,
          invoice_watermark: invoiceSettings.watermark,
        },
      };

      const response = await EntityService.updateEntity(entity.uuid, updateData);

      if (response.success) {
        const updatedEntity = response.results?.entity;
        if (updatedEntity) {
          // Update store
          setEntity(updatedEntity);
        }

        toast.success('Success', { description: 'Settings saved successfully!' });
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error('Error', { description: error.message || 'Failed to save settings' });

    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Error', { description: 'Passwords do not match' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Error', { description: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      // This would call AuthService.changePassword
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Success', { description: 'Password changed successfully!' });
      
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "company":
        return renderCompanySettings();
      case "tax":
        return renderTaxSettings();
      case "invoice":
        return renderInvoiceSettings();
      case "security":
        return renderSecuritySettings();
      case "system":
        return renderSystemSettings();
      default:
        return null;
    }
  };

  // Company Settings Tab
  const renderCompanySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Company Name"
            value={company.name}
            onChange={(value: any) => handleCompanyChange("name", value)}
            prefixIcon={<Building size={15} />}
            required
          />
        </div>
        <div>
          <Input
            label="Email Address"
            type="email"
            value={company.email}
            onChange={(value: any) => handleCompanyChange("email", value)}
            prefixIcon={<Mail size={15} />}
            required
          />
        </div>
        <div>
          <Input
            label="Phone Number"
            value={company.phone}
            onChange={(value: any) => handleCompanyChange("phone", value)}
            prefixIcon={<Phone size={15} />}
          />
        </div>
        <div>
          <Input
            label="Website"
            value={company.website}
            onChange={(value: any) => handleCompanyChange("website", value)}
            prefixIcon={<Globe size={15} />}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Address"
            value={company.address}
            onChange={(value: any) => handleCompanyChange("address", value)}
            prefixIcon={<MapPin size={15} />}
          />
        </div>
        <div>
          <Input
            label="City"
            value={company.city}
            onChange={(value: any) => handleCompanyChange("city", value)}
          />
        </div>
        <div>
          <Input
            label="State/Region"
            value={company.state}
            onChange={(value: any) => handleCompanyChange("state", value)}
          />
        </div>
        <div>
          <Input
            label="Country"
            value={company.country}
            onChange={(value: any) => handleCompanyChange("country", value)}
          />
        </div>
        <div>
          <Input
            label="ZIP/Postal Code"
            value={company.zip_code}
            onChange={(value: any) => handleCompanyChange("zip_code", value)}
          />
        </div>
        <div>
          <Input
            label="Tax ID"
            value={company.tax_id}
            onChange={(value: any) => handleCompanyChange("tax_id", value)}
          />
        </div>
        <div>
          <Input
            label="Registration Number"
            value={company.registration_number}
            onChange={(value: any) => handleCompanyChange("registration_number", value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-light mb-1">
            Currency
          </label>
          <select
            value={company.currency}
            onChange={(e) => handleCompanyChange("currency", e.target.value)}
            className="w-full p-2.5 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-text"
          >
            <option value="GHS">Ghana Cedi (GHS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="NGN">Nigerian Naira (NGN)</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Tax Settings Tab
  const renderTaxSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="VAT Rate (%)"
            type="number"
            value={taxSettings.tax_rate}
            onChange={(value: any) =>
              handleTaxChange("tax_rate", parseFloat(value) || 0)
            }
            prefixIcon={<Percent size={15} />}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
        <div>
          <Input
            label="NHIL Rate (%)"
            type="number"
            value={taxSettings.nhil}
            onChange={(value: any) =>
              handleTaxChange("nhil", parseFloat(value) || 0)
            }
            prefixIcon={<Percent size={15} />}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
        <div>
          <Input
            label="GETFund Rate (%)"
            type="number"
            value={taxSettings.getfund}
            onChange={(value: any) =>
              handleTaxChange("getfund", parseFloat(value) || 0)
            }
            prefixIcon={<Percent size={15} />}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
        <div>
          <Input
            label="COVID-19 Levy Rate (%)"
            type="number"
            value={taxSettings.covid_levy}
            onChange={(value: any) =>
              handleTaxChange("covid_levy", parseFloat(value) || 0)
            }
            prefixIcon={<Percent size={15} />}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </div>

      <div className="bg-card p-4 border border-border rounded-lg">
        <h4 className="font-semibold text-text mb-3">Tax Settings</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Enable VAT</span>
            <Switch
              checked={taxSettings.vat_enabled}
              onChange={(checked: boolean) =>
                handleTaxChange("vat_enabled", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable NHIL</span>
            <Switch
              checked={taxSettings.nhil_enabled}
              onChange={(checked: boolean) =>
                handleTaxChange("nhil_enabled", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable GETFund</span>
            <Switch
              checked={taxSettings.getfund_enabled}
              onChange={(checked: boolean) =>
                handleTaxChange("getfund_enabled", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable COVID-19 Levy</span>
            <Switch
              checked={taxSettings.covid_levy_enabled}
              onChange={(checked: boolean) =>
                handleTaxChange("covid_levy_enabled", checked)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Invoice Settings Tab
  const renderInvoiceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Invoice Prefix"
            value={invoiceSettings.prefix}
            onChange={(value: any) => handleInvoiceChange("prefix", value)}
            prefixIcon={<FileText size={15} />}
            placeholder="e.g. INV"
          />
        </div>
        <div>
          <Input
            label="Watermark Text"
            value={invoiceSettings.watermark}
            onChange={(value: any) => handleInvoiceChange("watermark", value)}
            placeholder="e.g. PAID, DRAFT, COPY"
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Footer Text"
            type="textarea"
            value={invoiceSettings.footer_text}
            onChange={(value: any) => handleInvoiceChange("footer_text", value)}
            rows={2}
            placeholder="Thank you for your business!"
          />
        </div>
      </div>
    </div>
  );

  // Security Settings Tab
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-card p-4 border border-border rounded-lg">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Change Password
        </h4>
        <div className="space-y-4">
          <div>
            <Input
              label="Current Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.current_password}
              onChange={(value: any) =>
                setPasswordData((prev) => ({ ...prev, current_password: value }))
              }
              suffixIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-light hover:text-text"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>
          <div>
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.new_password}
              onChange={(value: any) =>
                setPasswordData((prev) => ({ ...prev, new_password: value }))
              }
            />
          </div>
          <div>
            <Input
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.confirm_password}
              onChange={(value: any) =>
                setPasswordData((prev) => ({ ...prev, confirm_password: value }))
              }
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </div>
    </div>
  );

  // System Settings Tab with Theme Integration
  const renderSystemSettings = () => (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-background">
          <h4 className="font-semibold text-text flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Theme Preferences
          </h4>
          <p className="text-text-light text-sm mt-1">
            Choose your preferred appearance mode
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`group relative p-4 rounded-lg border-2 transition-all duration-200 ${
                theme === "light"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-background"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  theme === "light" 
                    ? "bg-primary/20" 
                    : "group-hover:bg-background"
                }`}>
                  <Sun className={`w-6 h-6 ${
                    theme === "light" 
                      ? "text-primary" 
                      : "text-yellow-500"
                  }`} />
                </div>
                <span className={`text-sm font-medium mt-2 ${
                  theme === "light" 
                    ? "text-primary" 
                    : "text-text"
                }`}>
                  Light
                </span>
                {theme === "light" && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`group relative p-4 rounded-lg border-2 transition-all duration-200 ${
                theme === "dark"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-background"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  theme === "dark" 
                    ? "bg-primary/20" 
                    : "group-hover:bg-background"
                }`}>
                  <Moon className={`w-6 h-6 ${
                    theme === "dark" 
                      ? "text-primary" 
                      : "text-slate-700 dark:text-slate-300"
                  }`} />
                </div>
                <span className={`text-sm font-medium mt-2 ${
                  theme === "dark" 
                    ? "text-primary" 
                    : "text-text"
                }`}>
                  Dark
                </span>
                {theme === "dark" && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setTheme("system")}
              className={`group relative p-4 rounded-lg border-2 transition-all duration-200 ${
                theme === "system"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-background"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  theme === "system" 
                    ? "bg-primary/20" 
                    : "group-hover:bg-background"
                }`}>
                  <Monitor className={`w-6 h-6 ${
                    theme === "system" 
                      ? "text-primary" 
                      : "text-blue-500"
                  }`} />
                </div>
                <span className={`text-sm font-medium mt-2 ${
                  theme === "system" 
                    ? "text-primary" 
                    : "text-text"
                }`}>
                  System
                </span>
                {theme === "system" && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </div>
            </button>
          </div>
          
          {/* Current theme indicator */}
          <div className="mt-4 p-3 bg-background rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-light">Current Theme</span>
              <span className="text-sm font-medium text-text capitalize">
                {resolvedTheme} {theme !== resolvedTheme && `(${theme})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-background">
          <h4 className="font-semibold text-text flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Data Management
          </h4>
          <p className="text-text-light text-sm mt-1">
            Manage your data with export, import, and backup options
          </p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => console.log("Export data")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            
            <Button
              onClick={() => console.log("Import data")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Import Data
            </Button>
            
            <Button
              onClick={() => console.log("Backup")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Backup Database
            </Button>
            
            <Button
              onClick={() => console.log("Clear cache")}
              variant="outline"
              className="flex items-center gap-2 text-danger hover:text-danger"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Cache
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Tab configuration
  const tabs = [
    { id: "company", label: "Company", icon: <Building className="w-4 h-4" /> },
    { id: "tax", label: "Tax Settings", icon: <Percent className="w-4 h-4" /> },
    { id: "invoice", label: "Invoices", icon: <FileText className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "system", label: "System", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              Settings
            </h1>
            <p className="text-text-light text-sm">
              Configure your system preferences and settings
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleSaveAll} 
              disabled={saving}
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {/* {successMessage && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-danger">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )} */}

        {/* Settings Tabs */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 p-2">
            <div className="flex overflow-x-auto gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-text-light hover:text-text hover:bg-background'
                      }
                    `}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;