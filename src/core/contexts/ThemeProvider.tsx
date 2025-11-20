import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEME_MODE_KEY } from '../hooks/useTheme';
import { getStoredItem, setStoredItem } from '../hooks/useStore';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

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

  const applyTheme = (newTheme: Theme) => {
    const resolved = resolveTheme(newTheme);
    
    // Update document attributes
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    
    setResolvedTheme(resolved);
  };

  const initializeTheme = () => {
    const savedTheme = (getStoredItem<Theme>(THEME_MODE_KEY, defaultTheme));
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredItem(THEME_MODE_KEY, newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

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
    // eslint-disable-next-line 
  }, [theme, enableSystem]);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
    // eslint-disable-next-line 
  }, []);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme,
    initializeTheme,
    isDark: resolvedTheme === 'dark',
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