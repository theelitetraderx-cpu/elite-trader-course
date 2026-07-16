"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "success" | "warning" | "danger" | "default";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    gold: "bg-[#D4AF37]/20 text-[#FFD700] border-[#D4AF37]/30",
    success: "bg-green-900/30 text-green-400 border-green-500/30",
    warning: "bg-yellow-900/30 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-900/30 text-red-400 border-red-500/30",
    default: "bg-white/5 text-[#A8A8A8] border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-normal",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
