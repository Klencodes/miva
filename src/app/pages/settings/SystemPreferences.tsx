import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../core/hooks/useLayout';
import { LayoutMode } from '../../layouts/types/layout';
import { usePageTitle } from '../../../core/hooks/usePageTitle';
import { SelectOption } from '../../../core/interfaces/ISelectOption';
import { Input, Breadcrumb } from '../../../ui';
import { IBreadcrumbItem } from '../../../ui/components/Breadcrumb';
import { appService } from '../../../core/services/app';
import { useTheme, ThemeColors, AppThemes, Theme } from '../../../core/contexts/ThemeProvider';

const SystemPreferences: React.FC = () => {
  usePageTitle("System Preferences"); 

  const { themes,theme, setTheme, updateThemes, resetToDefaultThemes } = useTheme();
  const { layoutMode, setLayoutMode } = useLayout();
  
  const [selectedThemeMode, setSelectedThemeMode] = useState<Theme>(theme);
  const [selectedLayout, setSelectedLayout] = useState<LayoutMode>(layoutMode);
  const [customLightTheme, setCustomLightTheme] = useState<ThemeColors>(themes.light);
  const [customDarkTheme, setCustomDarkTheme] = useState<ThemeColors>(themes.dark);

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Store', url: '/store' },
    { label: 'System Preferences', url: '/settings/preference', isActive: true }
  ];

  const layoutOptions: SelectOption[] = [
    { value: LayoutMode.VERTICAL, label: 'Vertical Layout' },
    { value: LayoutMode.HORIZONTAL, label: 'Horizontal Layout' },
  ];

  const themeModeOptions: SelectOption[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  // Sync with theme service
  useEffect(() => {
    setSelectedThemeMode(theme);
  }, [theme]);

  useEffect(() => {
    setSelectedLayout(layoutMode);
  }, [layoutMode]);

  // Load current theme colors
  useEffect(() => {
    setCustomLightTheme({ ...themes.light });
    setCustomDarkTheme({ ...themes.dark });
  }, [themes]);

  const onLayoutChange = (newLayout: LayoutMode) => {
    setSelectedLayout(newLayout);
    setLayoutMode(newLayout);
  };

  const onThemeModeChange = (newMode: Theme) => {
    setSelectedThemeMode(newMode);
    setTheme(newMode);
  };

  const validateColor = (value: string, colorType: string) => {
    let cleanedValue = (value || '').replace(/[^0-9A-Fa-f]/g, '');
    
    if (cleanedValue.length > 6) {
      cleanedValue = cleanedValue.substring(0, 6);
    }
    
    const hexValue = cleanedValue ? `#${cleanedValue}` : '#';

    const updateTheme = (theme: ThemeColors, property: keyof ThemeColors, hex: string) => {
      return { ...theme, [property]: hex };
    };

    const parts = colorType.split('.');
    if (parts.length === 2) {
      const [themeName, property] = parts;
      const themeProperty = property as keyof ThemeColors;
      
      if (themeName === 'light') {
        setCustomLightTheme(prev => updateTheme(prev, themeProperty, hexValue));
      } else if (themeName === 'dark') {
        setCustomDarkTheme(prev => updateTheme(prev, themeProperty, hexValue));
      }
    } else {
      const property = colorType as keyof ThemeColors;
      setCustomLightTheme(prev => updateTheme(prev, property, hexValue));
      setCustomDarkTheme(prev => updateTheme(prev, property, hexValue));
    }
  };

  const applyCustomTheme = async () => {
    const customThemes: AppThemes = {
      light: { ...customLightTheme },
      dark: { ...customDarkTheme },
    };
    const palyload  = {theme_string: JSON.stringify(customThemes)}
    await appService.updateTheme(palyload);
    updateThemes(customThemes);
  };

  const refreshTheme = () => {
    resetToDefaultThemes();
  };

  const ColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    colorType: string;
    iconColor: string;
    iconClick?: () => void;
  }> = ({ label, value, onChange, colorType, iconColor, iconClick }) => (
    <div className="card card-bg p-4">
      <label className="block text-sm font-medium text-text mb-2 flex items-center gap-2 cursor-pointer">
        <i className={`ri-drop-fill text-lg`} style={{ color: iconColor }} />
        {label}
      </label>
      <input type="color" id="iconColor" onChange={iconClick} value={iconColor}  className="hidden h-10 w-8 p-0 rounded-xs cursor-pointer border border-border" />
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          onChange={(newValue) => validateColor(newValue, colorType)}
          placeholder="#RRGGBB"
          prefixIcon={"palette"}
        />
         
      </div>
    </div>
  );

  return (
    <div className="mb-6 transition-all duration-300">
      {/* Breadcrumb Section */}
      <Breadcrumb breadcrumbs={breadcrumbs} pageTitle="System Preferences" pageSubtitle="Manage Your System Preferences"  />
     

      {/* Layout and Theme Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Input
          label="App Layout"
          type="select"
          selectOptions={layoutOptions}
          value={selectedLayout}
          onChange={(newValue) => onLayoutChange(newValue as LayoutMode)}
          prefixIcon={"layout"}
        />

        <Input
          label="Theme Mode"
          type="select"
          selectOptions={themeModeOptions}
          value={selectedThemeMode}
          onChange={(newValue) => onThemeModeChange(newValue as Theme)}
          prefixIcon={"palette"}
        />
      </div>

      {/* Theme Customization */}
      <div className="my-6 transition-all duration-300">
        <div className="space-y-6">
          {/* Shared Colors */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-text">Shared Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput
                label="Primary"
                value={customLightTheme.primary}
                onChange={(value) => validateColor(value, 'primary')}
                colorType="primary"
                iconColor={customLightTheme.primary}
              />
              <ColorInput
                label="Success"
                value={customLightTheme.success}
                onChange={(value) => validateColor(value, 'success')}
                colorType="success"
                iconColor={customLightTheme.success}
              />
              <ColorInput
                label="Info"
                value={customLightTheme.info}
                onChange={(value) => validateColor(value, 'info')}
                colorType="info"
                iconColor={customLightTheme.info}
              />
              <ColorInput
                label="Danger"
                value={customLightTheme.danger}
                onChange={(value) => validateColor(value, 'danger')}
                colorType="danger"
                iconColor={customLightTheme.danger}
              />
            </div>
          </div>

          {/* Light Theme Colors */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-text">Light Theme Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput
                label="Background"
                value={customLightTheme.background}
                onChange={(value) => validateColor(value, 'light.background')}
                colorType="light.background"
                iconColor={customLightTheme.background}
              />
              <ColorInput
                label="Card"
                value={customLightTheme.card}
                onChange={(value) => validateColor(value, 'light.card')}
                colorType="light.card"
                iconColor={customLightTheme.card}
              />
              <ColorInput
                label="Text"
                value={customLightTheme.text}
                onChange={(value) => validateColor(value, 'light.text')}
                colorType="light.text"
                iconColor={customLightTheme.text}
              />
              <ColorInput
                label="Text Light"
                value={customLightTheme.textLight}
                onChange={(value) => validateColor(value, 'light.textLight')}
                colorType="light.textLight"
                iconColor={customLightTheme.textLight}
              />
              <ColorInput
                label="Border"
                value={customLightTheme.border}
                onChange={(value) => validateColor(value, 'light.border')}
                colorType="light.border"
                iconColor={customLightTheme.border}
              />
              <ColorInput
                label="Disabled"
                value={customLightTheme.disabled}
                onChange={(value) => validateColor(value, 'light.disabled')}
                colorType="light.disabled"
                iconColor={customLightTheme.disabled}
              />
            </div>
          </div>

          {/* Dark Theme Colors */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-text">Dark Theme Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput
                label="Background"
                value={customDarkTheme.background}
                onChange={(value) => validateColor(value, 'dark.background')}
                colorType="dark.background"
                iconColor={customDarkTheme.background}
              />
              <ColorInput
                label="Card"
                value={customDarkTheme.card}
                onChange={(value) => validateColor(value, 'dark.card')}
                colorType="dark.card"
                iconColor={customDarkTheme.card}
              />
              <ColorInput
                label="Text"
                value={customDarkTheme.text}
                onChange={(value) => validateColor(value, 'dark.text')}
                colorType="dark.text"
                iconColor={customDarkTheme.text}
              />
              <ColorInput
                label="Text Light"
                value={customDarkTheme.textLight}
                onChange={(value) => validateColor(value, 'dark.textLight')}
                colorType="dark.textLight"
                iconColor={customDarkTheme.textLight}
              />
              <ColorInput
                label="Border"
                value={customDarkTheme.border}
                onChange={(value) => validateColor(value, 'dark.border')}
                colorType="dark.border"
                iconColor={customDarkTheme.border}
              />
              <ColorInput
                label="Disabled"
                value={customDarkTheme.disabled}
                onChange={(value) => validateColor(value, 'dark.disabled')}
                colorType="dark.disabled"
                iconColor={customDarkTheme.disabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={refreshTheme}
          className="flex items-center px-4 py-2 text-text border border-border rounded-md hover:bg-background transition-colors duration-200"
        >
          <i className="ri-refresh-line mr-2"></i>
          Reset
        </button>
        <button
          onClick={applyCustomTheme}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors duration-200"
        >
          <i className="ri-check-line mr-2"></i>
          Apply Theme
        </button>
      </div>
    </div>
  );
};
export default SystemPreferences;