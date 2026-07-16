import Link from "next/link";
import {
  GraduationCap,
  Target,
  Shield,
  Users,
  ArrowRight,
} from "lucide-react";
import { HeroSection } from "@/components/public/hero-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BRAND,
  WHY_CHOOSE_US,
  ELITE_ADVANTAGES,
  CONTACT,
} from "@/lib/constants";

const iconMap = {
  GraduationCap,
  Target,
  Shield,
  Users,
};

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">
            Why The Elite Trader
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
            Built for Serious Traders
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CHOOSE_US.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Target;
            return (
              <Card key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h3 className="font-heading text-lg text-white mb-2">{item.title}</h3>
                <p className="text-[#A8A8A8] text-sm">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="py-20 px-6 bg-[#101010] border-y border-[rgba(212,175,55,0.1)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              The Elite Advantage
            </h2>
            <p className="text-[#A8A8A8] max-w-2xl mx-auto">{BRAND.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ELITE_ADVANTAGES.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[#050505]"
              >
                <h3 className="text-[#FFD700] font-medium mb-2">{item.title}</h3>
                <p className="text-[#A8A8A8] text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="font-heading text-3xl font-bold text-white mb-4">
          Ready to Become Elite?
        </h2>
        <p className="text-[#A8A8A8] mb-8">{BRAND.tagline}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/pricing">
            <Button variant="gold" size="lg">
              View Plans
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg">
              Join on Telegram
            </Button>
          </a>
        </div>
      </section>
    </>
  );
}
