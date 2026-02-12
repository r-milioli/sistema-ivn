import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};

// Dark mode desabilitado - tema sempre claro
// const THEME_KEY = 'sistema-ivn-theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Dark mode desabilitado - forçar sempre tema claro
  // const getSystemTheme = () => {
  //   if (typeof window === 'undefined') return 'light';
  //   return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  // };
  // const resolveTheme = (t) => (t === 'system' ? getSystemTheme() : t);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    setResolvedTheme('light');
  }, []);

  // useEffect que aplicava dark/system - desabilitado
  // useEffect(() => {
  //   const resolved = resolveTheme(theme);
  //   setResolvedTheme(resolved);
  //   const root = document.documentElement;
  //   if (resolved === 'dark') root.classList.add('dark');
  //   else root.classList.remove('dark');
  // }, [theme]);
  // useEffect(() => {
  //   if (theme !== 'system') return;
  //   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  //   const handleChange = () => { ... };
  //   mediaQuery.addEventListener('change', handleChange);
  //   return () => mediaQuery.removeEventListener('change', handleChange);
  // }, [theme]);

  const setTheme = (t) => {
    setThemeState(t);
    // localStorage.setItem(THEME_KEY, t); // dark mode desabilitado
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
