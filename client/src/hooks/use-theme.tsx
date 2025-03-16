import { createContext, useContext, useEffect, useState } from "react";
import { userApi } from "@/lib/api";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
      root.setAttribute("data-theme", systemTheme);
      return;
    }

    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
  }, [theme]);

  // Save theme preference to server if user is logged in
  useEffect(() => {
    // Only update server if theme is explicitly selected (not default)
    if (theme !== defaultTheme) {
      // Try to update user preference if authenticated
      userApi.updatePreference('theme', theme).catch(() => {
        // Silently fail if not authenticated or request fails
        // Local storage will still keep the preference
      });
    }
  }, [theme, defaultTheme]);

  // Save theme preference to local storage
  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  // Load user preference from server on initial load if available
  useEffect(() => {
    const loadUserThemePreference = async () => {
      try {
        const response = await userApi.getPreference('theme');
        if (response.success && response.exists && response.value) {
          const userTheme = response.value as Theme;
          if (userTheme !== theme) {
            setTheme(userTheme);
          }
        }
      } catch (error) {
        // Silently fail if not authenticated or request fails
      }
    };
    
    loadUserThemePreference();
  }, []);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};