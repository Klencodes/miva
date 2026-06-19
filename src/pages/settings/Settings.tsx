import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/common';
import { Building, Mail, Phone, Globe, MapPin, Percent, FileText, Calendar, Bell, Shield, Key, EyeOff, Eye, Palette, Sun, Moon, Monitor, Layout, Upload, Globe2, Database, Download, RefreshCw, ArrowLeft, SettingsIcon, Save, Check, AlertCircle, LucideUploadCloud } from 'lucide-react';
import Switch from '../../components/common/Switch';

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

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  logo: string | null;
  favicon: string | null;
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
}

interface SystemSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Company Settings
  const [company, setCompany] = useState<CompanySettings>({
    name: 'MIVA-CRIMP JV',
    email: 'info@mivacrimp.com',
    phone: '+233 20 123 4567',
    address: '123 Industrial Area',
    city: 'Accra',
    state: 'Greater Accra',
    country: 'Ghana',
    zipCode: 'GA-123-4567',
    taxId: 'TIN-123456789',
    registrationNumber: 'RC-2024-001',
    website: 'www.mivacrimp.com',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    fiscalYearStart: '2024-01-01'
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
    covidLevyEnabled: true
  });

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: 'INV',
    nextNumber: 1001,
    dueDays: 30,
    terms: 'Net 30',
    footerText: 'Thank you for your business!',
    showDiscount: true,
    showTaxDetails: true,
    watermark: 'PAID'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    invoiceCreated: true,
    invoicePaid: true,
    invoiceOverdue: true,
    lowStock: true,
    customerUpdate: false,
    systemUpdate: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: [],
    allowedIPs: ''
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    primaryColor: '#059669',
    logo: null,
    favicon: null,
    sidebarCollapsed: false,
    fontSize: 'medium',
    density: 'comfortable'
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timezone: 'Africa/Accra',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'GHS',
    language: 'en',
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info'
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Handle company settings change
  const handleCompanyChange = (field: keyof CompanySettings, value: any) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  };

  // Handle tax settings change
  const handleTaxChange = (field: keyof TaxSettings, value: any) => {
    setTaxSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle invoice settings change
  const handleInvoiceChange = (field: keyof InvoiceSettings, value: any) => {
    setInvoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle notification settings change
  const handleNotificationChange = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle security settings change
  const handleSecurityChange = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle appearance settings change
  const handleAppearanceChange = (field: keyof AppearanceSettings, value: any) => {
    setAppearanceSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle system settings change
  const handleSystemChange = (field: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => ({ ...prev, [field]: value }));
  };

  // Save all settings
  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const allSettings = {
        company,
        taxSettings,
        invoiceSettings,
        notificationSettings,
        securitySettings,
        appearanceSettings,
        systemSettings
      };

      console.log('Settings saved:', allSettings);
      setSuccessMessage('All settings saved successfully!');
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
      
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password changed successfully');
      setSuccessMessage('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      setErrorMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return renderCompanySettings();
      case 'tax':
        return renderTaxSettings();
      case 'invoice':
        return renderInvoiceSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'system':
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
            onChange={(e: any) => handleCompanyChange('name', e)}
            prefixIcon={<Building size={15}/>}
          />
        </div>
        <div>
          <Input
            label="Email Address"
            type="email"
            value={company.email}
            onChange={(e: any) => handleCompanyChange('email', e)}
            prefixIcon={<Mail size={15}/>}
          />
        </div>
        <div>
          <Input
            label="Phone Number"
            value={company.phone}
            onChange={(e: any) => handleCompanyChange('phone', e)}
            prefixIcon={<Phone size={15}/>}
          />
        </div>
        <div>
          <Input
            label="Website"
            value={company.website}
            onChange={(e: any) => handleCompanyChange('website', e)}
            prefixIcon={<Globe size={15}/>}
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Address"
            value={company.address}
            onChange={(e: any) => handleCompanyChange('address', e)}
            prefixIcon={<MapPin size={15}/>}
          />
        </div>
        <div>
          <Input
            label="City"
            value={company.city}
            onChange={(e: any) => handleCompanyChange('city', e)}
          />
        </div>
        <div>
          <Input
            label="State/Region"
            value={company.state}
            onChange={(e: any) => handleCompanyChange('state', e)}
          />
        </div>
        <div>
          <Input
            label="Country"
            value={company.country}
            onChange={(e: any) => handleCompanyChange('country', e)}
          />
        </div>
        <div>
          <Input
            label="ZIP/Postal Code"
            value={company.zipCode}
            onChange={(e: any) => handleCompanyChange('zipCode', e)}
          />
        </div>
        <div>
          <Input
            label="Tax ID"
            value={company.taxId}
            onChange={(e: any) => handleCompanyChange('taxId', e)}
          />
        </div>
        <div>
          <Input
            label="Registration Number"
            value={company.registrationNumber}
            onChange={(e: any) => handleCompanyChange('registrationNumber', e)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Currency</label>
          <select
            value={company.currency}
            onChange={(e) => handleCompanyChange('currency', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="GHS">Ghana Cedi (GHS)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="NGN">Nigerian Naira (NGN)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Timezone</label>
          <select
            value={company.timezone}
            onChange={(e) => handleCompanyChange('timezone', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
            <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
            <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Date Format</label>
          <select
            value={company.dateFormat}
            onChange={(e) => handleCompanyChange('dateFormat', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Time Format</label>
          <select
            value={company.timeFormat}
            onChange={(e) => handleCompanyChange('timeFormat', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
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
            onChange={(e: any) => handleCompanyChange('fiscalYearStart', e)}
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
            onChange={(e: any) => handleTaxChange('taxRate', parseFloat(e) || 0)}
            prefixIcon={<Percent size={15}/>}
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
            onChange={(e: any) => handleTaxChange('nhilRate', parseFloat(e) || 0)}
            prefixIcon={<Percent size={15}/>}
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
            onChange={(e: any) => handleTaxChange('getfundRate', parseFloat(e) || 0)}
            prefixIcon={<Percent size={15}/>}
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
            onChange={(e: any) => handleTaxChange('covidLevyRate', parseFloat(e) || 0)}
            prefixIcon={<Percent size={15}/>}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3">Tax Settings</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Enable VAT</span>
            <Switch
              checked={taxSettings.vatEnabled}
                onChange={(checked: boolean) => handleTaxChange('vatEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable NHIL</span>
            <Switch
              checked={taxSettings.nhilEnabled}
              onChange={(checked: boolean) => handleTaxChange('nhilEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable GETFund</span>
            <Switch
              checked={taxSettings.getfundEnabled}
              onChange={(checked: boolean) => handleTaxChange('getfundEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Enable COVID-19 Levy</span>
            <Switch
              checked={taxSettings.covidLevyEnabled}
              onChange={(checked: boolean) => handleTaxChange('covidLevyEnabled', checked)}
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
            onChange={(e: any) => handleInvoiceChange('prefix', e)}
            prefixIcon={<FileText size={15}/>}
            placeholder="e.g. INV"
          />
        </div>
        <div>
          <Input
            label="Next Invoice Number"
            type="number"
            value={invoiceSettings.nextNumber}
            onChange={(e: any) => handleInvoiceChange('nextNumber', parseInt(e) || 1001)}
            min={1}
          />
        </div>
        <div>
          <Input
            label="Default Due Days"
            type="number"
            value={invoiceSettings.dueDays}
            onChange={(e: any) => handleInvoiceChange('dueDays', parseInt(e) || 30)}
            min={0}
            prefixIcon={<Calendar size={15}/>}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Default Terms</label>
          <select
            value={invoiceSettings.terms}
            onChange={(e) => handleInvoiceChange('terms', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
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
            onChange={(e: any) => handleInvoiceChange('footerText', e)}
            rows={2}
            placeholder="Thank you for your business!"
          />
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3">Invoice Display Options</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Show Discount Column</span>
            <Switch
              checked={invoiceSettings.showDiscount}
              onChange={(checked: boolean) => handleInvoiceChange('showDiscount', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Show Tax Details</span>
            <Switch
              checked={invoiceSettings.showTaxDetails}
              onChange={(checked: boolean) => handleInvoiceChange('showTaxDetails', checked)}
            />
          </div>
        </div>
        <div className="mt-3">
          <Input
            label="Watermark Text"
            value={invoiceSettings.watermark}
            onChange={(e: any) => handleInvoiceChange('watermark', e)}
            placeholder="e.g. PAID, DRAFT, COPY"
          />
        </div>
      </div>
    </div>
  );

  // Notification Settings Tab
  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification Channels
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Email Notifications</span>
            <Switch
              checked={notificationSettings.email}
              onChange={(checked: boolean) => handleNotificationChange('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">SMS Notifications</span>
            <Switch
              checked={notificationSettings.sms}
              onChange={(checked: boolean) => handleNotificationChange('sms', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Push Notifications</span>
            <Switch
              checked={notificationSettings.push}
              onChange={(checked: boolean) => handleNotificationChange('push', checked)}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification Events
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Invoice Created</span>
            <Switch
              checked={notificationSettings.invoiceCreated}
              onChange={(checked: boolean) => handleNotificationChange('invoiceCreated', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Invoice Paid</span>
            <Switch
              checked={notificationSettings.invoicePaid}
              onChange={(checked: boolean) => handleNotificationChange('invoicePaid', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Invoice Overdue</span>
            <Switch
              checked={notificationSettings.invoiceOverdue}
              onChange={(checked: boolean) => handleNotificationChange('invoiceOverdue', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Low Stock Alert</span>
            <Switch
              checked={notificationSettings.lowStock}
              onChange={(checked: boolean) => handleNotificationChange('lowStock', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Customer Updates</span>
            <Switch
              checked={notificationSettings.customerUpdate}
              onChange={(checked: boolean) => handleNotificationChange('customerUpdate', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">System Updates</span>
            <Switch
              checked={notificationSettings.systemUpdate}
              onChange={(checked: boolean) => handleNotificationChange('systemUpdate', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Security Settings Tab
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Settings
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Two-Factor Authentication</span>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onChange={(checked: boolean) => handleSecurityChange('twoFactorAuth', checked)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div>
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e: any) => handleSecurityChange('sessionTimeout', parseInt(e) || 30)}
              min={5}
              max={120}
            />
          </div>
          <div>
            <Input
              label="Password Expiry (days)"
              type="number"
              value={securitySettings.passwordExpiry}
              onChange={(e: any) => handleSecurityChange('passwordExpiry', parseInt(e) || 90)}
              min={30}
              max={365}
            />
          </div>
          <div>
            <Input
              label="Max Login Attempts"
              type="number"
              value={securitySettings.loginAttempts}
              onChange={(e: any) => handleSecurityChange('loginAttempts', parseInt(e) || 5)}
              min={3}
              max={10}
            />
          </div>
          <div>
            <Input
              label="IP Whitelist (comma separated)"
              value={securitySettings.allowedIPs}
              onChange={(e: any) => handleSecurityChange('allowedIPs', e)}
              placeholder="e.g. 192.168.1.1, 10.0.0.1"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Change Password
        </h4>
        <div className="space-y-4">
          <div>
            <Input
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e: any) => setPasswordData(prev => ({ ...prev, currentPassword: e }))}
              suffixIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-text-light"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
          <div>
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e: any) => setPasswordData(prev => ({ ...prev, newPassword: e }))}
            />
          </div>
          <div>
            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e: any) => setPasswordData(prev => ({ ...prev, confirmPassword: e }))}
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 "
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </div>
  );

  // Appearance Settings Tab
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Theme
        </h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <button
              onClick={() => handleAppearanceChange('theme', 'light')}
              className={`flex-1 p-4 border-2  text-center transition-all ${
                appearanceSettings.theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => handleAppearanceChange('theme', 'dark')}
              className={`flex-1 p-4 border-2  text-center transition-all ${
                appearanceSettings.theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Moon className="w-6 h-6 mx-auto mb-2 text-slate-700" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => handleAppearanceChange('theme', 'system')}
              className={`flex-1 p-4 border-2  text-center transition-all ${
                appearanceSettings.theme === 'system'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Monitor className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Primary Color</label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={appearanceSettings.primaryColor}
                onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                className="w-12 h-12  cursor-pointer border-2 border-slate-200"
              />
              <span className="text-sm text-text-light">{appearanceSettings.primaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Layout className="w-4 h-4" />
          Layout & Display
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Collapse Sidebar</span>
            <Switch
              checked={appearanceSettings.sidebarCollapsed}
              onChange={(checked: boolean) => handleAppearanceChange('sidebarCollapsed', checked)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Font Size</label>
            <select
              value={appearanceSettings.fontSize}
              onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">UI Density</label>
            <select
              value={appearanceSettings.density}
              onChange={(e) => handleAppearanceChange('density', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <LucideUploadCloud className="w-4 h-4" />
          Branding
        </h4>
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-300  p-8 text-center">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-text-light">Drag & drop or click to upload logo</p>
            <p className="text-xs text-text-light mt-1">PNG, JPG, SVG (Max 2MB)</p>
            <Button className="mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 ">
              Upload Logo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // System Settings Tab
  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Globe2 className="w-4 h-4" />
          Regional Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Language</label>
            <select
              value={systemSettings.language}
              onChange={(e) => handleSystemChange('language', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Currency</label>
            <select
              value={systemSettings.currency}
              onChange={(e) => handleSystemChange('currency', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
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

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          System & Maintenance
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text">Maintenance Mode</span>
            <Switch
              checked={systemSettings.maintenanceMode}
              onChange={(checked: boolean) => handleSystemChange('maintenanceMode', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text">Debug Mode</span>
            <Switch
              checked={systemSettings.debugMode}
              onChange={(checked: boolean) => handleSystemChange('debugMode', checked)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Log Level</label>
            <select
              value={systemSettings.logLevel}
              onChange={(e) => handleSystemChange('logLevel', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200  focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
              <option value="trace">Trace</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-50  p-4 border border-slate-200">
        <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Data Management
        </h4>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => console.log('Export data')}
            className="bg-white border border-slate-200 text-text hover:bg-slate-50 px-4 py-2  flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button
            onClick={() => console.log('Import data')}
            className="bg-white border border-slate-200 text-text hover:bg-slate-50 px-4 py-2  flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
          <Button
            onClick={() => console.log('Backup')}
            className="bg-white border border-slate-200 text-text hover:bg-slate-50 px-4 py-2  flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Backup Database
          </Button>
          <Button
            onClick={() => console.log('Clear cache')}
            className="bg-white border border-slate-200 text-text hover:bg-slate-50 px-4 py-2  flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="bg-white  shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100  transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6 text-emerald-600" />
                  Settings
                </h1>
                <p className="text-text-light text-sm">Configure your system preferences and settings</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5  shadow-lg shadow-emerald-200 transition-all duration-300 flex items-center gap-2"
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
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200  flex items-center gap-2 text-emerald-700">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200  flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Settings Tabs */}
        <div className="bg-white  shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex overflow-x-auto p-2 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5  text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-text-light hover:text-text hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab configuration
const tabs = [
  { id: 'company', label: 'Company', icon: <Building className="w-4 h-4" /> },
  { id: 'tax', label: 'Tax Settings', icon: <Percent className="w-4 h-4" /> },
  { id: 'invoice', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'system', label: 'System', icon: <Database className="w-4 h-4" /> },
];

export default SettingsPage;