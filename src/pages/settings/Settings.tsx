import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/common";
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Percent,
  FileText,
  Calendar,
  Bell,
  Shield,
  Key,
  EyeOff,
  Eye,
  Palette,
  Sun,
  Moon,
  Monitor,
  Layout,
  Upload,
  Globe2,
  Database,
  Download,
  RefreshCw,
  ArrowLeft,
  SettingsIcon,
  Save,
  Check,
  AlertCircle,
  LucideUploadCloud,
} from "lucide-react";
import Switch from "../../components/common/Switch";
import { useTheme } from "../../core/contexts/ThemeProvider";

// Types
interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  taxId: string;
  registrationNumber: string;
  website: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYearStart: string;
}

interface TaxSettings {
  taxRate: number;
  nhilRate: number;
  getfundRate: number;
  covidLevyRate: number;
  vatEnabled: boolean;
  nhilEnabled: boolean;
  getfundEnabled: boolean;
  covidLevyEnabled: boolean;
}

interface InvoiceSettings {
  prefix: string;
  nextNumber: number;
  dueDays: number;
  terms: string;
  footerText: string;
  showDiscount: boolean;
  showTaxDetails: boolean;
  watermark: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  invoiceCreated: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  lowStock: boolean;
  customerUpdate: boolean;
  systemUpdate: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginAttempts: number;
  ipWhitelist: string[];
  allowedIPs: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Company Settings
  const [company, setCompany] = useState<CompanySettings>({
    name: "MIVA-CRIMP JV",
    email: "info@mivacrimp.com",
    phone: "+233 20 123 4567",
    address: "123 Industrial Area",
    city: "Accra",
    state: "Greater Accra",
    country: "Ghana",
    zipCode: "GA-123-4567",
    taxId: "TIN-123456789",
    registrationNumber: "RC-2024-001",
    website: "www.mivacrimp.com",
    currency: "GHS",
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    fiscalYearStart: "2024-01-01",
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxRate: 12.5,
    nhilRate: 2.5,
    getfundRate: 2.5,
    covidLevyRate: 1.0,
    vatEnabled: true,
    nhilEnabled: true,
    getfundEnabled: true,
    covidLevyEnabled: true,
  });

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: "INV",
    nextNumber: 1001,
    dueDays: 30,
    terms: "Net 30",
    footerText: "Thank you for your business!",
    showDiscount: true,
    showTaxDetails: true,
    watermark: "PAID",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      email: true,
      sms: false,
      push: true,
      invoiceCreated: true,
      invoicePaid: true,
      invoiceOverdue: true,
      lowStock: true,
      customerUpdate: false,
      systemUpdate: true,
    });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: [],
    allowedIPs: "",
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

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

  // Handle notification settings change
  const handleNotificationChange = (
    field: keyof NotificationSettings,
    value: any,
  ) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Handle security settings change
  const handleSecurityChange = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings((prev) => ({ ...prev, [field]: value }));
  };

  // Save all settings
  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const allSettings = {
        company,
        taxSettings,
        invoiceSettings,
        notificationSettings,
        securitySettings,
        theme: theme,
      };

      console.log("Settings saved:", allSettings);
      setSuccessMessage("All settings saved successfully!");

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage("Failed to save settings. Please try again.");

      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Password changed successfully");
      setSuccessMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      setErrorMessage("Failed to change password");
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
      case "notifications":
        return renderNotificationSettings();
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
            onChange={(e: any) => handleCompanyChange("name", e)}
            prefixIcon={<Building size={15} />}
          />
        </div>
        <div>
          <Input
            label="Email Address"
            type="email"
            value={company.email}
            onChange={(e: any) => handleCompanyChange("email", e)}
            prefixIcon={<Mail size={15} />}
          />
        </div>
        <div>
          <Input
            label="Phone Number"
            value={company.phone}
            onChange={(e: any) => handleCompanyChange("phone", e)}
            prefixIcon={<Phone size={15} />}
          />
        </div>
        <div>
          <Input
            label="Website"
            value={company.website}
            onChange={(e: any) => handleCompanyChange("website", e)}
            prefixIcon={<Globe size={15} />}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Address"
            value={company.address}
            onChange={(e: any) => handleCompanyChange("address", e)}
            prefixIcon={<MapPin size={15} />}
          />
        </div>
        <div>
          <Input
            label="City"
            value={company.city}
            onChange={(e: any) => handleCompanyChange("city", e)}
          />
        </div>
        <div>
          <Input
            label="State/Region"
            value={company.state}
            onChange={(e: any) => handleCompanyChange("state", e)}
          />
        </div>
        <div>
          <Input
            label="Country"
            value={company.country}
            onChange={(e: any) => handleCompanyChange("country", e)}
          />
        </div>
        <div>
          <Input
            label="ZIP/Postal Code"
            value={company.zipCode}
            onChange={(e: any) => handleCompanyChange("zipCode", e)}
          />
        </div>
        <div>
          <Input
            label="Tax ID"
            value={company.taxId}
            onChange={(e: any) => handleCompanyChange("taxId", e)}
          />
        </div>
        <div>
          <Input
            label="Registration Number"
            value={company.registrationNumber}
            onChange={(e: any) => handleCompanyChange("registrationNumber", e)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Currency
          </label>
          <select
            value={company.currency}
            onChange={(e) => handleCompanyChange("currency", e.target.value)}
            className="w-full p-2.5 bg-card border border-border  focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-text"
          >
            <option value="GHS">Ghana Cedi (GHS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="NGN">Nigerian Naira (NGN)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Timezone
          </label>
          <select
            value={company.timezone}
            onChange={(e) => handleCompanyChange("timezone", e.target.value)}
            className="w-full p-2.5 bg-card border border-border  focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-text"
          >
            <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
            <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
            <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Date Format
          </label>
          <select
            value={company.dateFormat}
            onChange={(e) => handleCompanyChange("dateFormat", e.target.value)}
            className="w-full p-2.5 bg-card border border-border  focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-text"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Time Format
          </label>
          <select
            value={company.timeFormat}
            onChange={(e) => handleCompanyChange("timeFormat", e.target.value)}
            className="w-full p-2.5 bg-card border border-border  focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-text"
          >
            <option value="12h">12-hour (hh:mm AM/PM)</option>
            <option value="24h">24-hour (hh:mm)</option>
          </select>
        </div>
        <div>
          <Input
            label="Fiscal Year Start"
            type="date"
            value={company.fiscalYearStart}
            onChange={(e: any) => handleCompanyChange("fiscalYearStart", e)}
          />
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
            value={taxSettings.taxRate}
            onChange={(e: any) =>
              handleTaxChange("taxRate", parseFloat(e) || 0)
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
            value={taxSettings.nhilRate}
            onChange={(e: any) =>
              handleTaxChange("nhilRate", parseFloat(e) || 0)
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
            value={taxSettings.getfundRate}
            onChange={(e: any) =>
              handleTaxChange("getfundRate", parseFloat(e) || 0)
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
            value={taxSettings.covidLevyRate}
            onChange={(e: any) =>
              handleTaxChange("covidLevyRate", parseFloat(e) || 0)
            }
            prefixIcon={<Percent size={15} />}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </div>

      <div className="bg-card p-4 border border-border ">
        <h4 className="font-semibold text-text mb-3">Tax Settings</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Enable VAT</span>
            <Switch
              checked={taxSettings.vatEnabled}
              onChange={(checked: boolean) =>
                handleTaxChange("vatEnabled", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable NHIL</span>
            <Switch
              checked={taxSettings.nhilEnabled}
              onChange={(checked: boolean) =>
                handleTaxChange("nhilEnabled", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable GETFund</span>
            <Switch
              checked={taxSettings.getfundEnabled}
              onChange={(checked: boolean) =>
                handleTaxChange("getfundEnabled", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable COVID-19 Levy</span>
            <Switch
              checked={taxSettings.covidLevyEnabled}
              onChange={(checked: boolean) =>
                handleTaxChange("covidLevyEnabled", checked)
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
            onChange={(e: any) => handleInvoiceChange("prefix", e)}
            prefixIcon={<FileText size={15} />}
            placeholder="e.g. INV"
          />
        </div>
        <div>
          <Input
            label="Next Invoice Number"
            type="number"
            value={invoiceSettings.nextNumber}
            onChange={(e: any) =>
              handleInvoiceChange("nextNumber", parseInt(e) || 1001)
            }
            min={1}
          />
        </div>
        <div>
          <Input
            label="Default Due Days"
            type="number"
            value={invoiceSettings.dueDays}
            onChange={(e: any) =>
              handleInvoiceChange("dueDays", parseInt(e) || 30)
            }
            min={0}
            prefixIcon={<Calendar size={15} />}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Default Terms
          </label>
          <select
            value={invoiceSettings.terms}
            onChange={(e) => handleInvoiceChange("terms", e.target.value)}
            className="w-full p-2.5 bg-card border border-border  focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-text"
          >
            <option value="Due on Receipt">Due on Receipt</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 45">Net 45</option>
            <option value="Net 60">Net 60</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Input
            label="Footer Text"
            type="textarea"
            value={invoiceSettings.footerText}
            onChange={(e: any) => handleInvoiceChange("footerText", e)}
            rows={2}
            placeholder="Thank you for your business!"
          />
        </div>
      </div>

      <div className="bg-card p-4 border border-border ">
        <h4 className="font-semibold text-text mb-3">
          Invoice Display Options
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Show Discount Column</span>
            <Switch
              checked={invoiceSettings.showDiscount}
              onChange={(checked: boolean) =>
                handleInvoiceChange("showDiscount", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Show Tax Details</span>
            <Switch
              checked={invoiceSettings.showTaxDetails}
              onChange={(checked: boolean) =>
                handleInvoiceChange("showTaxDetails", checked)
              }
            />
          </div>
        </div>
        <div className="mt-3">
          <Input
            label="Watermark Text"
            value={invoiceSettings.watermark}
            onChange={(e: any) => handleInvoiceChange("watermark", e)}
            placeholder="e.g. PAID, DRAFT, COPY"
          />
        </div>
      </div>
    </div>
  );

  // Notification Settings Tab
  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-card p-4 border border-border ">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notification Channels
        </h4>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-text">Email Notifications</span>
            <Switch
              checked={notificationSettings.email}
              onChange={(checked: boolean) =>
                handleNotificationChange("email", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">SMS Notifications</span>
            <Switch
              checked={notificationSettings.sms}
              onChange={(checked: boolean) =>
                handleNotificationChange("sms", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Push Notifications</span>
            <Switch
              checked={notificationSettings.push}
              onChange={(checked: boolean) =>
                handleNotificationChange("push", checked)
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-card p-4 border border-border ">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Notification Events
        </h4>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-text">Invoice Created</span>
            <Switch
              checked={notificationSettings.invoiceCreated}
              onChange={(checked: boolean) =>
                handleNotificationChange("invoiceCreated", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Invoice Paid</span>
            <Switch
              checked={notificationSettings.invoicePaid}
              onChange={(checked: boolean) =>
                handleNotificationChange("invoicePaid", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Invoice Overdue</span>
            <Switch
              checked={notificationSettings.invoiceOverdue}
              onChange={(checked: boolean) =>
                handleNotificationChange("invoiceOverdue", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Low Stock Alert</span>
            <Switch
              checked={notificationSettings.lowStock}
              onChange={(checked: boolean) =>
                handleNotificationChange("lowStock", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Customer Updates</span>
            <Switch
              checked={notificationSettings.customerUpdate}
              onChange={(checked: boolean) =>
                handleNotificationChange("customerUpdate", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">System Updates</span>
            <Switch
              checked={notificationSettings.systemUpdate}
              onChange={(checked: boolean) =>
                handleNotificationChange("systemUpdate", checked)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Security Settings Tab
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-card p-4 border border-border ">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security Settings
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Two-Factor Authentication</span>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onChange={(checked: boolean) =>
                handleSecurityChange("twoFactorAuth", checked)
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div>
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e: any) =>
                handleSecurityChange("sessionTimeout", parseInt(e) || 30)
              }
              min={5}
              max={120}
            />
          </div>
          <div>
            <Input
              label="Password Expiry (days)"
              type="number"
              value={securitySettings.passwordExpiry}
              onChange={(e: any) =>
                handleSecurityChange("passwordExpiry", parseInt(e) || 90)
              }
              min={30}
              max={365}
            />
          </div>
          <div>
            <Input
              label="Max Login Attempts"
              type="number"
              value={securitySettings.loginAttempts}
              onChange={(e: any) =>
                handleSecurityChange("loginAttempts", parseInt(e) || 5)
              }
              min={3}
              max={10}
            />
          </div>
          <div>
            <Input
              label="IP Whitelist (comma separated)"
              value={securitySettings.allowedIPs}
              onChange={(e: any) => handleSecurityChange("allowedIPs", e)}
              placeholder="e.g. 192.168.1.1, 10.0.0.1"
            />
          </div>
        </div>
      </div>

      <div className="bg-card p-4 border border-border ">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Change Password
        </h4>
        <div className="space-y-4">
          <div>
            <Input
              label="Current Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e: any) =>
                setPasswordData((prev) => ({ ...prev, currentPassword: e }))
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
              value={passwordData.newPassword}
              onChange={(e: any) =>
                setPasswordData((prev) => ({ ...prev, newPassword: e }))
              }
            />
          </div>
          <div>
            <Input
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e: any) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: e }))
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
      <div className="bg-card border border-border  overflow-hidden">
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
              className={`group relative p-4  border-2 transition-all duration-200 ${
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
              className={`group relative p-4  border-2 transition-all duration-200 ${
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
              className={`group relative p-4  border-2 transition-all duration-200 ${
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
          <div className="mt-4 p-3 bg-background  border border-border">
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
      <div className="bg-card border border-border  overflow-hidden">
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
              className="group px-4 py-2.5 bg-card border border-border hover:border-primary hover:bg-primary/5  transition-all duration-200 flex items-center gap-2 text-text"
            >
              <Download className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span>Export Data</span>
            </Button>
            
            <Button
              onClick={() => console.log("Import data")}
              variant="outline"
              className="group px-4 py-2.5 bg-card border border-border hover:border-primary hover:bg-primary/5  transition-all duration-200 flex items-center gap-2 text-text"
            >
              <Upload className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span>Import Data</span>
            </Button>
            
            <Button
              onClick={() => console.log("Backup")}
              variant="outline"
              className="group px-4 py-2.5 bg-card border border-border hover:border-primary hover:bg-primary/5  transition-all duration-200 flex items-center gap-2 text-text"
            >
              <Database className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span>Backup Database</span>
            </Button>
            
            <Button
              onClick={() => console.log("Clear cache")}
              variant="outline"
              className="group px-4 py-2.5 bg-card border border-border hover:border-danger hover:bg-danger/5  transition-all duration-200 flex items-center gap-2 text-text"
            >
              <RefreshCw className="w-4 h-4 group-hover:text-danger transition-colors" />
              <span>Clear Cache</span>
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
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "system", label: "System", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="">
      <div className="">
        {/* Page Header */}
        <div className="bg-card  border border-border shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4  mb-6">
            <div className="flex items-center gap-4">
              
              <div>
                <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                  Settings
                </h1>
                <p className="text-text-light text-sm">
                  Configure your system preferences and settings
                </p>
              </div>
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
          {successMessage && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20  flex items-center gap-2 text-success">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/20  flex items-center gap-2 text-danger">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Settings Tabs */}
        <div className="bg-card  border border-border shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 p-2">
            <div className="flex overflow-x-auto gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5  text-sm font-medium transition-all duration-200 whitespace-nowrap
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