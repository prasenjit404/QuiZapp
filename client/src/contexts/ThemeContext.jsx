import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 'light' | 'dark'
  const [theme, setTheme] = useState("light");

  // on mount read saved preference or fallback to system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("quizapp_theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
        return;
      }
      // no saved pref -> follow system preference
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    } catch (e) {
      console.warn("Theme init failed", e);
    }
  }, []);

  // whenever theme changes -> persist and apply class
  useEffect(() => {
    try {
      localStorage.setItem("quizapp_theme", theme);
    } catch (e) {}
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
