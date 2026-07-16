"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<{ role: string } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setSession(data.user ?? null))
      .catch(() => setSession(null));
  }, []);

  const portalHref = session?.role === "admin" ? "/admin" : "/dashboard";
  const portalLabel = session ? "Portal" : "Login";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card mx-4 mt-4 rounded-2xl border border-[rgba(212,175,55,0.25)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <BrandLogo
              size="md"
              className="hidden sm:flex"
              imageClassName="shadow-[0_0_16px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_24px_rgba(212,175,55,0.35)] transition-shadow"
            />
            <BrandLogo size="sm" className="sm:hidden" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm uppercase tracking-wider transition-colors",
                  pathname === link.href
                    ? "text-[#FFD700]"
                    : "text-[#A8A8A8] hover:text-[#FFD700]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href={session ? portalHref : "/login"}>
              <Button variant="gold" size="sm">
                {portalLabel}
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-[#D4AF37]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mx-4 mt-2 glass-card rounded-2xl p-6"
          >
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm uppercase tracking-wider text-[#A8A8A8] hover:text-[#FFD700] py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link href={session ? portalHref : "/login"} onClick={() => setMobileOpen(false)}>
                <Button variant="gold" size="sm" className="w-full mt-2">
                  {portalLabel}
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
