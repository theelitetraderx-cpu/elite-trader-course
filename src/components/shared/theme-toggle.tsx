"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalTheme } from "@/lib/theme/portal-theme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = usePortalTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "touch-target flex items-center justify-center gap-2 p-2 rounded-xl transition-colors",
        "text-[var(--portal-muted)] hover:text-[#FFD700] hover:bg-[var(--portal-hover)]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {showLabel && (
        <span className="text-xs font-medium hidden sm:inline">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
