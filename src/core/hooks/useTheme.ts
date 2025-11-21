// hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';
import { getStoredItem, setStoredItem } from './useStore';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textLight: string;
  border: string;
  disabled: string;
  danger: string;
  info: string;
  success: string;
}

export interface AppThemes {
  light: ThemeColors;
  dark: ThemeColors;
}
export const THEME_MODE_KEY = 'theme-mode';

export type ThemeMode = 'light' | 'dark' | 'system';

const defaultThemes: AppThemes = {
  light: {
    primary: '#ff6b57',
    secondary: '#6c757d',
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#212529',
    textLight: '#495057',
    border: '#ced4da',
    disabled: '#e9ecef',
    danger: '#FF453A',
    info: '#e08e00',
    success: '#34C759',
  },
  dark: {
    primary: '#ff6b57',
    secondary: '#6c757d',
    background: '#0a0a0a',
    card: '#171717',
    text: '#EAEAEA',
    textLight: '#A7A9AB',
    border: '#404040',
    disabled: '#343a40',
    danger: '#FF453A',
    info: '#e08e00',
    success: '#34C759',
  },
};

export const useTheme = () => {
  
  const [themes, setThemes] = useState<AppThemes>(defaultThemes);
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      return (getStoredItem<ThemeMode>(THEME_MODE_KEY, "system"));
    } catch {
      return 'system';
    }
  });

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const applyCssVariables = useCallback((colors: ThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--background-color', colors.background);
    root.style.setProperty('--card-color', colors.card);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--text-light-color', colors.textLight);
    root.style.setProperty('--border-color', colors.border);
    root.style.setProperty('--disabled-color', colors.disabled);
    root.style.setProperty('--danger-color', colors.danger);
    root.style.setProperty('--info-color', colors.info);
    root.style.setProperty('--success-color', colors.success);
  }, []);

  const updateHtmlAttributes = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const applyTheme = useCallback((themeMode: ThemeMode) => {
    const effectiveMode = themeMode === 'system' ? getSystemTheme() : themeMode;
    const currentThemes = themes;

    if (currentThemes && currentThemes[effectiveMode]) {
      applyCssVariables(currentThemes[effectiveMode]);
    }
    updateHtmlAttributes(effectiveMode);
  }, [themes, getSystemTheme, applyCssVariables, updateHtmlAttributes]);

  const saveThemeMode = useCallback((themeMode: ThemeMode) => {
    try {
      setStoredItem(THEME_MODE_KEY, themeMode);
    } catch {
      // Ignore errors
    }
  }, []);

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setMode(themeMode);
    saveThemeMode(themeMode);
    applyTheme(themeMode);
  }, [saveThemeMode, applyTheme]);

  const updateThemes = useCallback((newThemes: AppThemes) => {
    setThemes(newThemes);
    applyTheme(mode);
  }, [mode, applyTheme]);

  const resetToDefaultThemes = useCallback(() => {
    setThemes(defaultThemes);
    applyTheme(mode);
  }, [mode, applyTheme]);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(mode);
  }, [applyTheme, mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, applyTheme]);

  return {
    themes,
    mode,
    setThemeMode,
    updateThemes,
    resetToDefaultThemes,
  };
};