import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "./use-local-storage";
import { apiRequest } from "@/lib/api-client";

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

// Create context
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);
  const [serverSyncedTheme, setServerSyncedTheme] = useState<Theme | null>(null);

  // Sync with database when user is logged in (if available)
  useEffect(() => {
    async function syncWithDatabase() {
      try {
        // Get user's theme from server
        const response = await apiRequest({
          method: 'GET',
          url: '/api/user/preferences/theme'
        });
        
        if (response.success && response.exists) {
          // If theme is stored on server and is different from local, use that
          const dbTheme = response.value as Theme;
          if (dbTheme !== theme) {
            setTheme(dbTheme);
          }
          setServerSyncedTheme(dbTheme);
        } else if (theme) {
          // If theme is not in database but we have a local theme, save to server
          await apiRequest({
            method: 'POST',
            url: '/api/user/preferences/theme',
            data: { value: theme }
          });
          setServerSyncedTheme(theme);
        }
      } catch (error) {
        // Failed to sync with server (likely not logged in)
        console.log("Theme not synced with server - user may not be logged in");
      }
    }

    syncWithDatabase();
  }, []);

  // Update database when theme changes (if already synced)
  useEffect(() => {
    async function updateDatabase() {
      if (serverSyncedTheme !== null && theme !== serverSyncedTheme) {
        try {
          await apiRequest({
            method: 'POST',
            url: '/api/user/preferences/theme',
            data: { value: theme }
          });
          setServerSyncedTheme(theme);
        } catch (error) {
          console.error("Failed to update theme in database", error);
        }
      }
    }

    updateDatabase();
  }, [theme, serverSyncedTheme]);

  // Update <html> element class when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

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