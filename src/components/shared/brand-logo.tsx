import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

const sizeMap = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 56,
  xl: 72,
  hero: 96,
} as const;

type BrandLogoSize = keyof typeof sizeMap;

interface BrandLogoProps {
  size?: BrandLogoSize;
  subtitle?: string;
  showSubtitle?: boolean;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "md",
  subtitle,
  showSubtitle = false,
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const dimension = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3 min-w-0", className)}>
      <Image
        src={BRAND.logoPath}
        alt={BRAND.name}
        width={dimension}
        height={dimension}
        priority={priority}
        className={cn("rounded-full shrink-0 object-cover", imageClassName)}
        style={{ width: dimension, height: dimension }}
      />
      {showSubtitle && subtitle && (
        <span className="text-[#A8A8A8] text-[10px] sm:text-xs uppercase tracking-wider truncate">
          {subtitle}
        </span>
      )}
    </div>
  );
}
