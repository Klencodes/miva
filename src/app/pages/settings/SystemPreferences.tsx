import React, { useState, useEffect } from "react";
import { useLayout } from "../../../core/hooks/useLayout";
import { LayoutMode } from "../../layouts/types/layout";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { Input, Breadcrumb } from "../../../ui";
import { IBreadcrumbItem } from "../../../ui/components/Breadcrumb";
import { appService } from "../../../core/services/app";
import {
  useTheme,
  ThemeColors,
  AppThemes,
  Theme,
} from "../../../core/contexts/ThemeProvider";
import { toast } from "sonner";
import { DateRangeValue } from "../../../ui/components/Input";

interface CustomThemePayload {
  theme: AppThemes;
  app_layout: string;
  theme_mode: Theme;
}

const SystemPreferences: React.FC = () => {
  usePageTitle("System Preferences");

  const { themes, theme, setTheme, updateThemes, resetToDefaultThemes } = useTheme();
  const { layoutMode, setLayoutMode } = useLayout();
  const [selectedThemeMode, setSelectedThemeMode] = useState<Theme>(theme);
  const [selectedLayout, setSelectedLayout] = useState<LayoutMode>(layoutMode);
  const [customLightTheme, setCustomLightTheme] = useState<ThemeColors>(themes.light);
  const [customDarkTheme, setCustomDarkTheme] = useState<ThemeColors>(themes.dark);

  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "System Preferences", url: "/settings/preference", isActive: true },
  ];

  const layoutOptions: SelectOption[] = [
    { value: LayoutMode.VERTICAL, label: "Vertical Layout" },
    { value: LayoutMode.HORIZONTAL, label: "Horizontal Layout" },
  ];

  const themeModeOptions: SelectOption[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  useEffect(() => { setSelectedThemeMode(theme); }, [theme]);
  useEffect(() => { setSelectedLayout(layoutMode); }, [layoutMode]);
  useEffect(() => {
    setCustomLightTheme({ ...themes.light });
    setCustomDarkTheme({ ...themes.dark });
  }, [themes]);

  const onLayoutChange = (newLayout: LayoutMode) => setSelectedLayout(newLayout);
  const onThemeModeChange = (newMode: Theme) => setSelectedThemeMode(newMode);

  // Handles color picker output (always valid #rrggbb) directly
  const setLightColor = (property: keyof ThemeColors, value: string) => {
    setCustomLightTheme(prev => ({ ...prev, [property]: value }));
  };

  const setDarkColor = (property: keyof ThemeColors, value: string) => {
    setCustomDarkTheme(prev => ({ ...prev, [property]: value }));
  };

  // Shared colors update both light and dark
  const setSharedColor = (property: keyof ThemeColors, value: string) => {
    setCustomLightTheme(prev => ({ ...prev, [property]: value }));
    setCustomDarkTheme(prev => ({ ...prev, [property]: value }));
  };

  const applyCustomTheme = async () => {
    const customThemes: CustomThemePayload = {
      theme: {
        light: { ...customLightTheme },
        dark: { ...customDarkTheme },
      },
      app_layout: selectedLayout,
      theme_mode: selectedThemeMode,
    };
    const payload = { theme_string: JSON.stringify(customThemes) };
    await appService.updateTheme(payload);
    updateThemes(customThemes.theme);
    setTheme(customThemes.theme_mode);
    setLayoutMode(customThemes.app_layout as LayoutMode);
    toast.success("Custom theme applied successfully!"); // Show success toast
  };

  const refreshTheme = () => resetToDefaultThemes();

  return (
    <div className="mb-6 transition-all duration-300">
      <Breadcrumb
        breadcrumbs={breadcrumbs}
        pageTitle="System Preferences"
        pageSubtitle="Manage Your System Preferences"
      />

      {/* Layout and Theme Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Input
          label="App Layout"
          type="select"
          selectOptions={layoutOptions}
          value={selectedLayout}
          onChange={(v) => onLayoutChange(v as LayoutMode)}
          prefixIcon="layout"
        />
        <Input
          label="Theme Mode"
          type="select"
          selectOptions={themeModeOptions}
          value={selectedThemeMode}
          onChange={(v) => onThemeModeChange(v as Theme)}
          prefixIcon="palette"
        />
      </div>

      {/* Theme Customization */}
      <div className="my-6 transition-all duration-300">
        <div className="space-y-6">

          {/* Shared Colors */}
          <div className="pt-4 bg-card rounded-md p-4">
            <h4 className="text-lg font-semibold mb-3 text-text">Shared Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Primary" type="color" value={customLightTheme.primary}
                onChange={(v) => setSharedColor('primary', v)} />
              <Input label="Success" type="color" value={customLightTheme.success}
                onChange={(v) => setSharedColor('success', v)} />
              <Input label="Info" type="color" value={customLightTheme.info}
                onChange={(v) => setSharedColor('info', v)} />
              <Input label="Danger" type="color" value={customLightTheme.danger}
                onChange={(v) => setSharedColor('danger', v)} />
            </div>
          </div>

          {/* Light Theme Colors */}
          <div className="pt-4 bg-card rounded-md p-4">
            <h4 className="text-lg font-semibold mb-3 text-text">Light Theme Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Background" type="color" value={customLightTheme.background}
                onChange={(v) => setLightColor('background', v)} />
              <Input label="Card" type="color" value={customLightTheme.card}
                onChange={(v) => setLightColor('card', v)} />
              <Input label="Text" type="color" value={customLightTheme.text}
                onChange={(v) => setLightColor('text', v)} />
              <Input label="Text Light" type="color" value={customLightTheme.textLight}
                onChange={(v) => setLightColor('textLight', v)} />
              <Input label="Border" type="color" value={customLightTheme.border}
                onChange={(v) => setLightColor('border', v)} />
              <Input label="Disabled" type="color" value={customLightTheme.disabled}
                onChange={(v) => setLightColor('disabled', v)} />
            </div>
          </div>

          {/* Dark Theme Colors */}
          <div className="pt-4 bg-card rounded-md p-4">
            <h4 className="text-lg font-semibold mb-3 text-text">Dark Theme Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Background" type="color" value={customDarkTheme.background}
                onChange={(v) => setDarkColor('background', v)} />
              <Input label="Card" type="color" value={customDarkTheme.card}
                onChange={(v) => setDarkColor('card', v)} />
              <Input label="Text" type="color" value={customDarkTheme.text}
                onChange={(v) => setDarkColor('text', v)} />
              <Input label="Text Light" type="color" value={customDarkTheme.textLight}
                onChange={(v) => setDarkColor('textLight', v)} />
              <Input label="Border" type="color" value={customDarkTheme.border}
                onChange={(v) => setDarkColor('border', v)} />
              <Input label="Disabled" type="color" value={customDarkTheme.disabled}
                onChange={(v) => setDarkColor('disabled', v)} />
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
          <i className="ri-refresh-line mr-2" />
          Reset
        </button>
        <button
          onClick={applyCustomTheme}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors duration-200"
        >
          <i className="ri-check-line mr-2" />
          Apply Theme
        </button>
      </div>
    </div>
  );
};

export default SystemPreferences;