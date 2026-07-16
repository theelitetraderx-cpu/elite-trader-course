import Link from "next/link";
import { CheckCircle2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS, SIGNAL_PLANS } from "@/lib/data/demo-data";
import { MEMBER_CODE, CONTACT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#D4AF37] text-sm uppercase tracking-widest mb-3">Pricing</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
          Choose Your Path
        </h1>
        <p className="text-[#A8A8A8] max-w-2xl mx-auto">
          Lifetime access on all course tiers. Enter member code{" "}
          <span className="text-[#FFD700] font-medium">{MEMBER_CODE}</span> when you
          enrol for exclusive pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {PRICING_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col",
              plan.popular && "border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.15)]"
            )}
          >
            {plan.popular && (
              <Badge variant="gold" className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Most Popular
              </Badge>
            )}
            <h2 className="font-heading text-2xl font-bold text-white mb-1">{plan.name}</h2>
            <p className="text-[#A8A8A8] text-sm mb-6">{plan.description}</p>
            <div className="mb-6">
              <span className="text-[#666] line-through text-lg mr-2">${plan.price}</span>
              <span className="font-numbers text-4xl font-bold text-[#FFD700]">
                ${plan.memberPrice}
              </span>
              <span className="text-[#A8A8A8] text-sm ml-2">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[#A8A8A8]">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/contact">
              <Button variant={plan.popular ? "gold" : "outline"} className="w-full">
                Enrol Now
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl font-bold text-white mb-2">
          Standalone Signal Plans
        </h2>
        <p className="text-[#A8A8A8] text-sm">
          Signals only — no full course required
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SIGNAL_PLANS.map((plan) => (
          <Card key={plan.name} className="text-center">
            <h3 className="font-heading text-lg text-white mb-2">{plan.name}</h3>
            <p className="font-numbers text-3xl text-[#FFD700] font-bold mb-1">
              ${"salePrice" in plan && plan.salePrice ? plan.salePrice : plan.price}
            </p>
            <p className="text-[#666] text-xs mb-3">{plan.period}</p>
            <p className="text-[#A8A8A8] text-sm">{plan.description}</p>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="gold" size="lg">
            Contact to Enrol
          </Button>
        </a>
      </div>
    </div>
  );
}
