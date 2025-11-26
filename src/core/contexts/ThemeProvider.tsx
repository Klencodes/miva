import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getStoredItem, setStoredItem } from '../hooks/useStore';
import { appService } from '../services/app';

export const THEME_MODE_KEY = 'theme-mode';
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

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

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
  isDark: boolean;
  // New properties for API themes
  themes: AppThemes;
  isThemeReady: boolean;
  updateThemes: (newThemes: AppThemes) => void;
  resetToDefaultThemes: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

const defaultThemes: AppThemes = {
  light: {
    primary: "#ff6b57",
    secondary: "#6c757d",
    background: "#f8f9fa",
    card: "#ffffff",
    text: "#212529",
    textLight: "#495057",
    border: "#ced4da",
    disabled: "#e9ecef",
    danger: "#FF453A",
    info: "#e08e00",
    success: "#34C759",
  },
  dark: {
    primary: "#ff6b57",
    secondary: "#6c757d",
    background: "#0a0a0a",
    card: "#171717",
    text: "#EAEAEA",
    textLight: "#A7A9AB",
    border: "#404040",
    disabled: "#343a40",
    danger: "#FF453A",
    info: "#e08e00",
    success: "#34C759",
  },
};

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  enableSystem = true 
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (getStoredItem<Theme>(THEME_MODE_KEY, defaultTheme));
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [themes, setThemes] = useState<AppThemes>(defaultThemes);
  const [isThemeReady, setIsThemeReady] = useState<boolean>(false);

  // Use refs to prevent infinite loops
  const themesRef = useRef(themes);
  const themeRef = useRef(theme);
  const resolvedThemeRef = useRef(resolvedTheme);

  // Keep refs updated
  useEffect(() => {
    themesRef.current = themes;
    themeRef.current = theme;
    resolvedThemeRef.current = resolvedTheme;
  }, [themes, theme, resolvedTheme]);

  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const resolveTheme = (theme: Theme): ResolvedTheme => {
    if (theme === 'system' && enableSystem) {
      return getSystemTheme();
    }
    return theme as ResolvedTheme;
  };

  const applyCssVariables = useCallback((colors: ThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty("--primary-color", colors.primary);
    root.style.setProperty("--secondary-color", colors.secondary);
    root.style.setProperty("--background-color", colors.background);
    root.style.setProperty("--card-color", colors.card);
    root.style.setProperty("--text-color", colors.text);
    root.style.setProperty("--text-light-color", colors.textLight);
    root.style.setProperty("--border-color", colors.border);
    root.style.setProperty("--disabled-color", colors.disabled);
    root.style.setProperty("--danger-color", colors.danger);
    root.style.setProperty("--info-color", colors.info);
    root.style.setProperty("--success-color", colors.success);
  }, []);

  const applyTheme = useCallback((newTheme: Theme, currentThemes: AppThemes = themesRef.current) => {
    const resolved = resolveTheme(newTheme);
    
    // Update document attributes
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    
    // Apply CSS variables from the current themes
    if (currentThemes && currentThemes[resolved]) {
      applyCssVariables(currentThemes[resolved]);
    }
    
    setResolvedTheme(resolved);
    // eslint-disable-next-line
  }, [applyCssVariables, enableSystem]);

  const initializeTheme = useCallback(() => {
    const savedTheme = (getStoredItem<Theme>(THEME_MODE_KEY, defaultTheme));
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, [defaultTheme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredItem(THEME_MODE_KEY, newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const themes: Theme[] = enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];
    const currentIndex = themes.indexOf(themeRef.current);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [enableSystem, setTheme]);

  const updateThemes = useCallback((newThemes: AppThemes) => {
    setThemes(newThemes);
    applyTheme(themeRef.current, newThemes);
  }, [applyTheme]);

  const resetToDefaultThemes = useCallback(() => {
    setThemes(defaultThemes);
    applyTheme(themeRef.current, defaultThemes);
  }, [applyTheme]);

  // Initialize theme on mount - only once
  useEffect(() => {
    const initializeAppTheme = async () => {
      setIsThemeReady(false);
      
      // Initialize local theme first
      initializeTheme();
      
      // Then fetch API theme
      try {
        const res = await appService.getTheme();
        if (res.success && res.results && res.results.themes) {
          updateThemes(res.results.themes);
        }
      } catch (error) {
        console.error("Failed to fetch API theme:", error);
      } finally {
        setIsThemeReady(true);
      }
    };

    initializeAppTheme();
  }, []); // Empty dependency array to run only once on mount

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system' && enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, enableSystem, applyTheme]);

  // Apply theme when themes change
  useEffect(() => {
    applyTheme(themeRef.current, themesRef.current);
  }, [themes, applyTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme,
    initializeTheme,
    isDark: resolvedTheme === 'dark',
    themes,
    isThemeReady,
    updateThemes,
    resetToDefaultThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};