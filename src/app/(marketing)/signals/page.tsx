import Link from "next/link";
import { Radio, CheckCircle2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SIGNAL_PLANS } from "@/lib/data/demo-data";
import { CONTACT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function SignalsPage() {
  return (
    <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">Signals</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
          Live Trading Signals
        </h1>
        <p className="text-[#A8A8A8] max-w-2xl mx-auto">
          High-probability setups delivered via our Telegram community. Choose a standalone
          signal plan or get signals included with PRO &amp; ELITE courses.
        </p>
      </div>

      <Card className="p-6 mb-10 flex items-start gap-4 border-[#D4AF37]/30">
        <Radio className="w-6 h-6 text-red-400 shrink-0 mt-1 animate-pulse" />
        <div>
          <h2 className="font-heading text-xl text-white mb-2">Live Market Coverage</h2>
          <p className="text-[#A8A8A8] text-sm">
            Futures and crypto signals with clear entries, risk parameters, and trade
            management — delivered to active members on Telegram.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {SIGNAL_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col",
              plan.popular && "border-[#D4AF37]"
            )}
          >
            {plan.popular && (
              <Badge variant="gold" className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Best Value
              </Badge>
            )}
            <h3 className="font-heading text-lg text-white mb-2">{plan.name}</h3>
            <p className="font-numbers text-3xl text-[#FFD700] font-bold mb-1">
              ${"salePrice" in plan && plan.salePrice ? plan.salePrice : plan.price}
            </p>
            {"salePrice" in plan && plan.salePrice && (
              <p className="text-[#666] text-sm line-through mb-1">${plan.price}</p>
            )}
            <p className="text-[#666] text-xs mb-4">{plan.period}</p>
            <p className="text-[#A8A8A8] text-sm flex-1">{plan.description}</p>
          </Card>
        ))}
      </div>

      <div className="glass-card p-8 mb-10">
        <h2 className="font-heading text-xl text-white mb-4">What You Get</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Live trade alerts on Telegram",
            "Clear entry, stop-loss & target levels",
            "Futures & crypto market coverage",
            "Weekly market analysis (PRO & ELITE)",
            "Community accountability",
            "Strategy updates for members",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-[#A8A8A8] text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="gold" size="lg" className="mr-4 mb-4">
            Get Signals on Telegram
          </Button>
        </a>
        <Link href="/pricing">
          <Button variant="outline" size="lg">
            Compare Full Course Plans
          </Button>
        </Link>
      </div>
    </div>
  );
}
