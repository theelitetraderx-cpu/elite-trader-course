"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type PortalTheme = "dark" | "light";

const STORAGE_KEY = "elite-portal-theme";

interface PortalThemeContextValue {
  theme: PortalTheme;
  setTheme: (theme: PortalTheme) => void;
  toggleTheme: () => void;
}

const PortalThemeContext = createContext<PortalThemeContextValue | null>(null);

function applyPortalTheme(theme: PortalTheme) {
  document.documentElement.setAttribute("data-portal-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function clearPortalTheme() {
  document.documentElement.removeAttribute("data-portal-theme");
  document.documentElement.style.colorScheme = "";
}

export function PortalThemeProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [theme, setThemeState] = useState<PortalTheme>("dark");

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = stored === "light" || stored === "dark" ? stored : "dark";
    setThemeState(initial);
    applyPortalTheme(initial);

    return () => clearPortalTheme();
  }, []);

  useLayoutEffect(() => {
    applyPortalTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: PortalTheme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <PortalThemeContext.Provider value={value}>
      <div
        className={cn("portal-shell min-h-screen min-h-[100dvh]", className)}
        data-theme={theme}
        suppressHydrationWarning
      >
        {children}
      </div>
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  const context = useContext(PortalThemeContext);
  if (!context) {
    throw new Error("usePortalTheme must be used within PortalThemeProvider");
  }
  return context;
}
