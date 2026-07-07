import { useState, useEffect } from 'react';

export type BrandTheme = 'light' | 'dark' | 'auto';

export const OTIMIZZA_COLORS = {
  primary: '#7C3AED', // Roxo Orvalho
  secondary: '#373435', // Escuro
  tertiary: '#F9FBFC', // Claro
  accent: '#6D28D9', // Roxo Escuro (gradient/active)

  // Para dark mode
  darkPrimary: '#8B5CF6', // Roxo Claro
  darkSecondary: '#FFFFFF',
  darkTertiary: '#1F2937',

  // Para light mode
  lightPrimary: '#7C3AED',
  lightSecondary: '#373435',
  lightTertiary: '#F9FBFC'
};

export const useBrandTheme = () => {
  const [theme, setTheme] = useState<BrandTheme>('auto');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateTheme();

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  const getBrandColor = (colorKey: keyof typeof OTIMIZZA_COLORS) => {
    return OTIMIZZA_COLORS[colorKey];
  };

  const getPrimaryColor = () => isDark ? OTIMIZZA_COLORS.darkPrimary : OTIMIZZA_COLORS.lightPrimary;
  const getSecondaryColor = () => isDark ? OTIMIZZA_COLORS.darkSecondary : OTIMIZZA_COLORS.lightSecondary;
  const getTertiaryColor = () => isDark ? OTIMIZZA_COLORS.darkTertiary : OTIMIZZA_COLORS.lightTertiary;

  return {
    theme,
    setTheme,
    isDark,
    colors: OTIMIZZA_COLORS,
    getBrandColor,
    getPrimaryColor,
    getSecondaryColor,
    getTertiaryColor
  };
};

export default useBrandTheme;
