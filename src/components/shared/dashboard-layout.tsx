"use client";



import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import {

  LayoutDashboard,

  BookOpen,

  FileText,

  ClipboardList,

  Download,

  TrendingUp,

  User,

  LogOut,

  Menu,

  X,

  Bell,

  Globe,

  Users,

  Video,

  Presentation,

  BarChart3,
  Radio,
  Receipt,
  Shield,
  Megaphone,
} from "lucide-react";

import { useState, useMemo } from "react";

import { cn, getInitials } from "@/lib/utils";

import { STUDENT_NAV, ADMIN_NAV } from "@/lib/constants";

import { BrandLogo } from "@/components/shared/brand-logo";

import { ThemeToggle } from "@/components/shared/theme-toggle";

import { PortalThemeProvider } from "@/lib/theme/portal-theme";

import { hasPermission } from "@/lib/admin/permissions";

import { isSuperAdmin } from "@/lib/admin/roles";

import type { SessionUser } from "@/types";



const iconMap: Record<string, React.ElementType> = {

  LayoutDashboard,

  BookOpen,

  FileText,

  ClipboardList,

  Download,

  TrendingUp,

  User,

  Globe,

  Users,

  Video,

  Presentation,

  BarChart3,

  Radio,

  Receipt,

  Shield,

  Megaphone,

};



interface DashboardLayoutProps {

  children: React.ReactNode;

  user: SessionUser;

  variant: "student" | "admin";

}



function DashboardLayoutInner({ children, user, variant }: DashboardLayoutProps) {

  const pathname = usePathname();

  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = useMemo(() => {
    const items = variant === "admin" ? ADMIN_NAV : STUDENT_NAV;
    if (variant !== "admin") return items;

    return items.filter((item) => {
      if (isSuperAdmin(user.role)) return true;
      if ("staffOnly" in item && item.staffOnly) return user.role === "admin";
      if ("permission" in item && item.permission) {
        return hasPermission(user.role, user.staff_permissions, item.permission);
      }
      return true;
    });
  }, [variant, user.role, user.staff_permissions]);

  const basePath = variant === "admin" ? "/admin" : "/dashboard";



  const handleLogout = async () => {

    await fetch("/api/auth/logout", { method: "POST" });

    router.push("/login");

    router.refresh();

  };



  return (

    <div className="min-h-screen flex">

      <aside

        className={cn(

          "portal-sidebar fixed inset-y-0 left-0 z-40 w-64 border-r transform transition-transform lg:translate-x-0 lg:static",

          sidebarOpen ? "translate-x-0" : "-translate-x-full"

        )}

      >

        <div className="flex flex-col h-full">

          <div className="p-6 border-b border-[var(--portal-border)]">

            <Link href={basePath} className="flex items-center gap-3 min-w-0">

              <BrandLogo size="md" imageClassName="shadow-[0_0_16px_rgba(212,175,55,0.2)]" />

              <p className="text-[var(--portal-muted)] text-xs uppercase truncate">

                {variant === "admin" ? "Admin Panel" : "Student Portal"}

              </p>

            </Link>

          </div>



          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

            {navItems.map((item) => {

              const Icon = iconMap[item.icon] || LayoutDashboard;

              const isActive =

                pathname === item.href ||

                (item.href !== basePath && pathname.startsWith(item.href));



              return (

                <Link

                  key={item.href}

                  href={item.href}

                  onClick={() => setSidebarOpen(false)}

                  className={cn(

                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",

                    isActive

                      ? "sidebar-link-active text-[#FFD700]"

                      : "text-[var(--portal-muted)] hover:text-[var(--portal-fg)] hover:bg-[var(--portal-hover)]"

                  )}

                >

                  <Icon className="w-5 h-5" />

                  {item.label}

                </Link>

              );

            })}

          </nav>



          <div className="p-4 border-t border-[var(--portal-border)] space-y-1">

            <div className="flex items-center justify-between px-2 py-1">

              <span className="text-[var(--portal-muted-2)] text-xs uppercase tracking-wider">Theme</span>

              <ThemeToggle showLabel />

            </div>

            <button

              onClick={handleLogout}

              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[var(--portal-muted)] hover:text-red-400 hover:bg-red-900/20 w-full transition-all"

            >

              <LogOut className="w-5 h-5" />

              Logout

            </button>

          </div>

        </div>

      </aside>



      {sidebarOpen && (

        <div

          className="fixed inset-0 z-30 lg:hidden"

          style={{ background: "var(--portal-overlay)" }}

          onClick={() => setSidebarOpen(false)}

        />

      )}



      <div className="flex-1 flex flex-col min-h-screen">

        <header className="sticky top-0 z-20 portal-header backdrop-blur-xl border-b px-6 py-4">

          <div className="flex items-center justify-between">

            <button

              className="lg:hidden text-[#D4AF37] touch-target"

              onClick={() => setSidebarOpen(!sidebarOpen)}

            >

              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}

            </button>



            <div className="flex-1 lg:flex-none" />



            <div className="flex items-center gap-2 sm:gap-4">

              <ThemeToggle className="lg:hidden" />

              <button className="relative text-[var(--portal-muted)] hover:text-[#FFD700] transition-colors touch-target p-2">

                <Bell className="w-5 h-5" />

                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFD700] rounded-full" />

              </button>

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] font-bold text-sm">

                  {getInitials(user.full_name)}

                </div>

                <div className="hidden sm:block">

                  <p className="text-[var(--portal-fg)] text-sm font-medium">{user.full_name}</p>

                  <p className="text-[var(--portal-muted)] text-xs capitalize">{user.role}</p>

                </div>

              </div>

            </div>

          </div>

        </header>



        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>

      </div>

    </div>

  );

}



export function DashboardLayout(props: DashboardLayoutProps) {

  return (

    <PortalThemeProvider>

      <DashboardLayoutInner {...props} />

    </PortalThemeProvider>

  );

}


