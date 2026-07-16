"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "gold",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      gold: "btn-gold",
      outline: "btn-outline-gold bg-transparent",
      ghost: "text-[#A8A8A8] hover:text-[#FFD700] hover:bg-white/5",
      danger: "bg-red-900/50 border border-red-500/50 text-red-400 hover:bg-red-900/80",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs rounded-lg",
      md: "px-6 py-3 text-sm rounded-xl",
      lg: "px-8 py-4 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium tracking-normal transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
