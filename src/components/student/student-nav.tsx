"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/dashboard/notes", label: "Learn", shortLabel: "Learn", icon: BookOpen },
  { href: "/dashboard/meetings", label: "Meetings", shortLabel: "Live", icon: Video },
  { href: "/dashboard/profile", label: "Profile", shortLabel: "Profile", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function StudentNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop tabs */}
      <nav
        className="hidden sm:flex items-center gap-1 mb-6 lg:mb-8 p-1 rounded-2xl border w-full sm:w-fit overflow-x-auto hide-scrollbar"
        style={{
          background: "var(--portal-bg-elevated)",
          borderColor: "var(--portal-border)",
        }}
        aria-label="Student navigation"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap touch-target",
                active
                  ? "bg-[#D4AF37]/20 text-[#FFD700] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.35)]"
                  : "text-[var(--portal-muted)] hover:text-[var(--portal-fg)] hover:bg-[var(--portal-hover)]"
              )}
            >
              <item.icon className={cn("w-4 h-4", active && "text-[#FFD700]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 student-bottom-nav safe-area-pb"
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch max-w-lg mx-auto px-2 pt-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[58px] rounded-xl mx-0.5 transition-all touch-target",
                  active
                    ? "text-[#FFD700] bg-[#D4AF37]/10"
                    : "text-[var(--portal-muted-3)] active:bg-[var(--portal-hover)]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    active && "scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.45)]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide",
                    active ? "text-[#FFD700]" : "text-[var(--portal-muted-3)]"
                  )}
                >
                  {item.shortLabel}
                </span>
                {active && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#FFD700]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
