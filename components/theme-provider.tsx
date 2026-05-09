'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: 'class';
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  attribute = 'class',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey);

    if (
      storedTheme === 'light' ||
      storedTheme === 'dark' ||
      storedTheme === 'system'
    ) {
      setTheme(storedTheme);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;

    const resolvedTheme =
      theme === 'system' && enableSystem
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    }
  }, [attribute, enableSystem, theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      window.localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
