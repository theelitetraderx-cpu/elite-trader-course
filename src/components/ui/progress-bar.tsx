"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-[#A8A8A8]">Progress</span>
          <span className="text-[#FFD700] font-numbers">{percentage}%</span>
        </div>
      )}
      <div className={cn("progress-gold w-full", heights[size])}>
        <div
          className="progress-gold-fill h-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
