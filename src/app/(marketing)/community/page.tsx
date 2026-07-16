import Link from "next/link";
import { Users, TrendingUp, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS } from "@/lib/data/demo-data";
import { CONTACT, STATS } from "@/lib/constants";

export default function CommunityPage() {
  return (
    <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">Community</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
          Elite Trading Community
        </h1>
        <p className="text-[#A8A8A8] max-w-2xl mx-auto">
          Join 300+ active traders sharing setups, discipline, and real market execution on
          Telegram.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {STATS.map((stat) => (
          <Card key={stat.label} className="text-center p-5">
            <p className="font-numbers text-2xl text-[#FFD700] font-bold">{stat.value}</p>
            <p className="text-[#A8A8A8] text-xs uppercase mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {TESTIMONIALS.map((item) => (
          <Card key={item.name} className="p-6">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold mb-4">
              {item.avatar}
            </div>
            <p className="text-[#A8A8A8] text-sm italic mb-4">&ldquo;{item.content}&rdquo;</p>
            <p className="text-white text-sm font-medium">{item.name}</p>
            <p className="text-[#666] text-xs">{item.role}</p>
          </Card>
        ))}
      </div>

      <Card className="p-8 md:p-10 text-center">
        <Users className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
        <h2 className="font-heading text-2xl text-white mb-3">Join the Community</h2>
        <p className="text-[#A8A8A8] text-sm mb-6 max-w-lg mx-auto">
          Real-time signals, market breakdowns, and accountability with traders who take
          execution seriously.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="gold">
              <MessageCircle className="w-4 h-4" />
              {CONTACT.telegram}
            </Button>
          </a>
          <Link href="/pricing">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4" />
              View Course Plans
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
