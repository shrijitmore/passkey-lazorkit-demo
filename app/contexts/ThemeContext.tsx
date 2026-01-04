'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  // Memoize toggleTheme to prevent re-renders
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  // Always render the Provider, even during SSR
  // The theme will be set correctly once mounted on the client
  return (
    <ThemeContext.Provider value={contextValue}>
      {!mounted ? (
        <div className="min-h-screen" suppressHydrationWarning>
          {children}
        </div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
