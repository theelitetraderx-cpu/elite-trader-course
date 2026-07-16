import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { BRAND, FOOTER_LINKS, CONTACT } from "@/lib/constants";
import { BrandLogo } from "@/components/shared/brand-logo";

export function Footer() {
  return (
    <footer className="bg-[#101010] border-t border-[rgba(212,175,55,0.15)] mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <BrandLogo size="lg" className="mb-6" imageClassName="shadow-[0_0_20px_rgba(212,175,55,0.2)]" />
            <p className="text-[#A8A8A8] text-sm leading-relaxed max-w-md mb-4">
              {BRAND.tagline} {BRAND.footerDescription}
            </p>
            <div className="flex flex-col gap-2 text-sm text-[#A8A8A8]">
              <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#D4AF37]" /> {CONTACT.telegram}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-[#FFD700] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37]" /> {CONTACT.email}
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-[#FFD700] mb-6 uppercase tracking-wider text-sm">Explore</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#A8A8A8] text-sm hover:text-[#FFD700] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-[#FFD700] mb-6 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#A8A8A8] text-sm hover:text-[#FFD700] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[rgba(212,175,55,0.15)] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A8A8A8] text-xs">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-[#A8A8A8] text-xs">{CONTACT.supportNote}</p>
        </div>
      </div>
    </footer>
  );
}
