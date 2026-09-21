import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  logoSrc: "/vf-logo-white.png?v=8",
});

const STORAGE_KEY = "vf_admin_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {
      // ignore
    }
    return "dark"; // Default to luxury dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      root.setAttribute("data-theme", "light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      root.setAttribute("data-theme", "dark");
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (nextTheme) => {
    if (nextTheme === "dark" || nextTheme === "light") {
      setThemeState(nextTheme);
    }
  };

  const isDark = theme === "dark";
  const logoSrc = isDark ? "/vf-logo-white.png?v=8" : "/vf-logo-dark.png?v=8";

  const contextValue = useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      setTheme,
      logoSrc,
    }),
    [theme, isDark, logoSrc],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
