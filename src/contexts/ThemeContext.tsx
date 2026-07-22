import React, { createContext, useContext, useState, useEffect } from 'react';
import { readMigrated } from '../lib/storage';

export type Theme = 'dia' | 'noite';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = readMigrated('orvalho_theme', 'otimizza_theme') as Theme;
    if (saved === 'dia' || saved === 'noite') {
      return saved;
    }
    // Padrão é sempre o tema Dia (claro) — decisão do dono (2026-07-22).
    // Não seguir mais o `prefers-color-scheme` do SO: usuário com o SO no escuro
    // não deve cair no Noite sem escolher. O Noite continua disponível no toggle.
    return 'dia';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'noite') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('orvalho_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dia' ? 'noite' : 'dia'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
