import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const VALID_THEMES = ['verde', 'blanco', 'oscuro'];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('vitality_theme');
    return VALID_THEMES.includes(saved) ? saved : 'verde';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vitality_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
