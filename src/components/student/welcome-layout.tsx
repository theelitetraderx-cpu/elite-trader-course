"use client";



import Link from "next/link";

import { useRouter, usePathname } from "next/navigation";

import { LogOut, Bell } from "lucide-react";

import { getInitials } from "@/lib/utils";

import { BrandLogo } from "@/components/shared/brand-logo";

import { ThemeToggle } from "@/components/shared/theme-toggle";

import { PortalThemeProvider } from "@/lib/theme/portal-theme";

import type { SessionUser } from "@/types";

import { StudentNav } from "@/components/student/student-nav";



interface StudentWelcomeLayoutProps {

  children: React.ReactNode;

  user: SessionUser;

}



function StudentWelcomeLayoutInner({

  children,

  user,

}: StudentWelcomeLayoutProps) {

  const router = useRouter();

  const pathname = usePathname();

  const isLessonPage = pathname.startsWith("/dashboard/notes");



  const handleLogout = async () => {

    await fetch("/api/auth/logout", { method: "POST" });

    router.push("/login");

    router.refresh();

  };



  return (

    <div className="flex flex-col relative overflow-x-hidden min-h-[100dvh]">

      <div

        className="fixed inset-0 bg-grid pointer-events-none"

        style={{ opacity: "var(--portal-grid-opacity)" }}

      />

      <div

        className="fixed top-0 right-0 w-[min(100vw,480px)] h-[min(100vw,480px)] bg-gradient-to-bl from-[#D4AF37]/6 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"

        style={{ opacity: "calc(var(--portal-grid-opacity) * 2)" }}

      />



      <header className="sticky top-0 z-40 safe-area-pt portal-header border-b backdrop-blur-xl">

        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 touch-target">

            <BrandLogo

              size="sm"

              className="sm:hidden"

              imageClassName="shadow-[0_0_16px_rgba(212,175,55,0.2)]"

            />

            <BrandLogo

              size="md"

              className="hidden sm:flex"

              imageClassName="shadow-[0_0_20px_rgba(212,175,55,0.25)]"

            />

            <span className="text-[var(--portal-muted)] text-[10px] sm:text-xs uppercase tracking-wider hidden md:block truncate">

              Student Portal

            </span>

          </Link>



          <div className="flex items-center gap-1 sm:gap-2">

            <ThemeToggle />



            <button

              type="button"

              className="relative touch-target flex items-center justify-center p-2 text-[var(--portal-muted)] hover:text-[#FFD700] transition-colors rounded-xl"

              aria-label="Notifications"

            >

              <Bell className="w-5 h-5" />

            </button>



            <Link

              href="/dashboard/profile"

              className="touch-target flex items-center gap-2 pl-1 sm:pl-2 sm:border-l rounded-xl"

              style={{ borderColor: "var(--portal-border)" }}

            >

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] text-xs font-bold ring-2 ring-[var(--portal-bg)]">

                {getInitials(user.full_name)}

              </div>

              <div className="text-right hidden sm:block max-w-[120px]">

                <p className="text-[var(--portal-fg)] text-sm font-medium leading-tight truncate">

                  {user.full_name.split(" ")[0]}

                </p>

                <p className="text-[#D4AF37] text-[10px] truncate">@{user.username}</p>

              </div>

            </Link>



            <button

              onClick={handleLogout}

              className="hidden md:flex touch-target items-center gap-2 px-3 py-2 rounded-xl text-[var(--portal-muted)] hover:text-red-400 hover:bg-red-950/20 text-xs transition-all"

            >

              <LogOut className="w-4 h-4" />

              Logout

            </button>

          </div>

        </div>

      </header>



      <main

        className={`flex-1 relative z-10 px-3 sm:px-6 py-4 sm:py-8 student-main-pb ${

          isLessonPage ? "pb-28 sm:pb-8" : ""

        }`}

      >

        <div className="max-w-6xl mx-auto w-full">

          <StudentNav />

          {children}

        </div>

      </main>

    </div>

  );

}



export function StudentWelcomeLayout({ children, user }: StudentWelcomeLayoutProps) {

  return (

    <PortalThemeProvider>

      <StudentWelcomeLayoutInner user={user}>{children}</StudentWelcomeLayoutInner>

    </PortalThemeProvider>

  );

}


