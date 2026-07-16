"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Crown,
  Lock,
  Play,
  Sparkles,
  Star,
  Unlock,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MEMBER_CODE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StudentPlanView } from "@/lib/student/build-plan-views";

const TIER_STYLES = {
  foundation: {
    icon: BookOpen,
    accent: "from-amber-600/20 to-transparent",
    ring: "ring-amber-500/25",
    badge: "default" as const,
  },
  pro: {
    icon: Zap,
    accent: "from-[#D4AF37]/25 to-transparent",
    ring: "ring-[#D4AF37]/30",
    badge: "gold" as const,
  },
  elite: {
    icon: Crown,
    accent: "from-[#FFD700]/30 to-transparent",
    ring: "ring-[#FFD700]/35",
    badge: "gold" as const,
  },
};

interface StudentPlanCardProps {
  plan: StudentPlanView;
  progress: number;
  index: number;
}

export function StudentPlanCard({ plan, progress, index }: StudentPlanCardProps) {
  const style = TIER_STYLES[plan.tier];
  const Icon = style.icon;
  const visibleModules = plan.publishedModules.slice(0, 2);

  if (!plan.unlocked) {
    return (
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all",
          "border-[var(--portal-border)] bg-[var(--portal-bg-elevated)]",
          plan.popular && "border-[#D4AF37]/35"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--portal-bg-subtle)]/80 to-[var(--portal-bg-elevated)] pointer-events-none" />
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="default" className="gap-1 bg-[var(--portal-bg-subtle)]">
            <Lock className="w-3 h-3" />
            Locked
          </Badge>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4 mb-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                "bg-[var(--portal-bg-subtle)] border border-[var(--portal-border)] opacity-60"
              )}
            >
              <Icon className="w-6 h-6 text-[var(--portal-muted)]" />
            </div>
            <div className="flex-1 min-w-0 pr-16">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--portal-fg)]">
                  {plan.course.title}
                </h3>
                {plan.popular && (
                  <Badge variant="gold" className="text-[10px] gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-[var(--portal-muted)] text-sm leading-relaxed">
                {plan.course.description}
              </p>
            </div>
          </div>

          <ul className="grid sm:grid-cols-2 gap-2 mb-5">
            {plan.highlights.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-xs text-[var(--portal-muted-2)]"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--portal-muted-3)] shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--portal-border)]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--portal-muted-2)]">
                Member price
              </p>
              <p className="font-numbers text-lg font-bold text-[#FFD700]">
                ${plan.memberPrice}
                <span className="text-[var(--portal-muted-2)] text-xs font-normal ml-1 line-through">
                  ${plan.price}
                </span>
              </p>
              <p className="text-[10px] text-[var(--portal-muted-3)]">
                Code {MEMBER_CODE} at enrolment
              </p>
            </div>
            <Link href="/contact">
              <Button variant="gold" size="sm" className="min-h-[44px]">
                <Sparkles className="w-4 h-4" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all ring-1",
        style.ring,
        "border-[#D4AF37]/30 bg-[var(--portal-bg-elevated)]",
        "hover:border-[#D4AF37]/50 hover:shadow-[0_8px_32px_rgba(212,175,55,0.12)]"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none",
          style.accent
        )}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Icon className="w-6 h-6 text-[#050505]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--portal-fg)]">
                {plan.course.title}
              </h3>
              <Badge variant={style.badge} className="text-[10px] gap-0.5">
                <Unlock className="w-3 h-3" />
                Unlocked
              </Badge>
            </div>
            <p className="text-[var(--portal-muted)] text-sm line-clamp-2">
              {plan.course.description}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[var(--portal-muted-2)]">Your progress</span>
            <span className="text-[#FFD700] font-medium">{progress}%</span>
          </div>
          <ProgressBar value={progress} size="sm" />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--portal-muted-2)] mb-4">
          <span>{plan.publishedModules.length} modules</span>
          <span>{plan.course.lesson_count} videos</span>
          {plan.course.duration_minutes > 0 && (
            <span>{Math.round(plan.course.duration_minutes / 60)}h content</span>
          )}
        </div>

        {visibleModules.length > 0 ? (
          <div className="space-y-2 mb-4">
            {visibleModules.map((mod, modIndex) => (
              <Link
                key={mod.id}
                href={`/dashboard/notes?course=${plan.course.id}&module=${mod.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-bg-subtle)] hover:border-[#D4AF37]/40 transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold flex items-center justify-center shrink-0">
                  {modIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--portal-fg)] truncate group-hover:text-[#FFD700] transition-colors">
                    {mod.title}
                  </p>
                  <p className="text-[10px] text-[var(--portal-muted-3)]">
                    {mod.videos.length} videos · {mod.ppts.length} PPT · {mod.notes.length} PDF
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--portal-muted-3)] group-hover:text-[#D4AF37] shrink-0" />
              </Link>
            ))}
            {plan.publishedModules.length > 2 && (
              <Link
                href={`/dashboard/notes?course=${plan.course.id}`}
                className="block text-center text-[#D4AF37] text-xs py-1 hover:text-[#FFD700]"
              >
                +{plan.publishedModules.length - 2} more modules
              </Link>
            )}
          </div>
        ) : (
          <p className="text-[var(--portal-muted-3)] text-xs mb-4">
            Content is being prepared — check back soon.
          </p>
        )}

        <Link href={`/dashboard/notes?course=${plan.course.id}`}>
          <Button variant="gold" size="sm" className="w-full sm:w-auto min-h-[44px]">
            <Play className="w-4 h-4 fill-current" />
            {progress > 0 ? "Continue Learning" : "Start Course"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
