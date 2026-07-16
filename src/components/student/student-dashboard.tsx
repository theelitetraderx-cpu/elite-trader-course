"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  Play,
  Radio,
  Send,
  Sparkles,
  Target,
  Video,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/constants";
import { getInitials, cn } from "@/lib/utils";
import {
  getHighestPlanTier,
  planTierLabel,
} from "@/lib/student/plan-access";
import type { StudentPlanView } from "@/lib/student/build-plan-views";
import { StudentPlanCard } from "@/components/student/student-plan-card";
import { StudentSupportCenter } from "@/components/student/student-support-center";
import type { LiveMeeting } from "@/types";

interface StudentDashboardProps {
  fullName: string;
  username: string;
  greeting: string;
  planViews: StudentPlanView[];
  userCourseIds: string[];
  meetings: LiveMeeting[];
  materialsCount: number;
  progressStats: {
    completedModules: number;
    totalModules: number;
    completionRate: number;
    watchTimeHours: number;
    watchTimeMinutes: number;
  };
  courseProgress: Record<string, number>;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function StudentDashboard({
  fullName,
  username,
  greeting,
  planViews,
  userCourseIds,
  meetings,
  materialsCount,
  progressStats,
  courseProgress,
}: StudentDashboardProps) {
  const firstName = fullName.split(" ")[0];
  const planViewsProp = planViews;
  const unlockedCount = planViewsProp.filter((p) => p.unlocked).length;

  const highestTier = useMemo(() => getHighestPlanTier(userCourseIds), [userCourseIds]);

  const continueTarget = useMemo(() => {
    for (const plan of planViewsProp) {
      if (!plan.unlocked || plan.publishedModules.length === 0) continue;
      return {
        courseId: plan.course.id,
        courseTitle: plan.course.title,
        module: plan.publishedModules[0],
        progress: courseProgress[plan.course.id] ?? 0,
      };
    }
    return null;
  }, [planViewsProp, courseProgress]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-6">
      {continueTarget && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-[52px] sm:top-[60px] z-30 -mx-1 px-1"
        >
          <Link
            href={`/dashboard/notes?course=${continueTarget.courseId}&module=${continueTarget.module.id}`}
            className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[#D4AF37]/35 bg-[var(--portal-bg-elevated)] shadow-[0_4px_24px_rgba(212,175,55,0.1)] active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-[#050505] fill-[#050505]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                Continue Learning · {continueTarget.progress}% complete
              </p>
              <p className="text-[var(--portal-fg)] text-sm font-medium truncate">
                {continueTarget.module.title}
              </p>
              <p className="text-[var(--portal-muted-3)] text-xs truncate">
                {continueTarget.courseTitle}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#D4AF37] shrink-0" />
          </Link>
        </motion.div>
      )}

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="glass-card p-5 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-[#D4AF37]/12 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-[#050505] text-xl sm:text-2xl font-bold shrink-0 shadow-[0_0_30px_rgba(212,175,55,0.25)]">
            {getInitials(fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1">
              {greeting}
            </p>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--portal-fg)] leading-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-[var(--portal-muted)] text-sm mt-1">@{username}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="gold">{planTierLabel(highestTier)}</Badge>
              <Badge variant="success">Active</Badge>
              {unlockedCount > 0 && (
                <Badge variant="default">
                  {unlockedCount} plan{unlockedCount !== 1 ? "s" : ""} unlocked
                </Badge>
              )}
            </div>
          </div>
          {unlockedCount === 0 && (
            <Link href="/contact" className="shrink-0">
              <Button variant="gold" size="sm" className="min-h-[44px] w-full sm:w-auto">
                <Sparkles className="w-4 h-4" />
                Get Enrolled
              </Button>
            </Link>
          )}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          {
            icon: BookOpen,
            label: "Plans Unlocked",
            value: `${unlockedCount}/3`,
            accent: "text-[#FFD700]",
          },
          {
            icon: Award,
            label: "Modules Done",
            value: progressStats.completedModules.toString(),
            accent: "text-[var(--portal-fg)]",
          },
          {
            icon: Clock,
            label: "Watch Time",
            value:
              progressStats.watchTimeHours > 0
                ? `${progressStats.watchTimeHours}h`
                : `${progressStats.watchTimeMinutes}m`,
            accent: "text-[var(--portal-fg)]",
          },
          {
            icon: Zap,
            label: "Completion",
            value: `${progressStats.completionRate}%`,
            accent: "text-[#FFD700]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-4 text-center hover:border-[#D4AF37]/35 transition-colors"
          >
            <stat.icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
            <p className={cn("font-numbers text-xl sm:text-2xl font-bold", stat.accent)}>
              {stat.value}
            </p>
            <p className="text-[var(--portal-muted-2)] text-[10px] sm:text-xs uppercase tracking-wider mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg sm:text-xl font-semibold text-[var(--portal-fg)] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4AF37]" />
              Your Learning Path
            </h2>
            <Link
              href="/dashboard/notes"
              className="text-xs text-[#D4AF37] hover:text-[#FFD700] flex items-center gap-1"
            >
              All content
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-[var(--portal-muted)] text-sm -mt-2">
            Courses unlock based on your enrolled plan. Upgrade anytime to access higher tiers.
          </p>

          <div className="space-y-4">
            {planViewsProp.map((plan, index) => (
              <StudentPlanCard
                key={plan.course.id}
                plan={plan}
                progress={courseProgress[plan.course.id] ?? 0}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--portal-fg)]">
            Quick Access
          </h2>

          {meetings[0] && (
            <div
              className={`glass-card p-5 relative overflow-hidden ${
                meetings[0].status === "live" ? "border-green-500/40" : ""
              }`}
            >
              {meetings[0].status === "live" && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-[10px] uppercase font-bold">Live</span>
                </div>
              )}
              <h3 className="text-sm font-semibold text-[var(--portal-fg)] flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-[#D4AF37]" />
                {meetings[0].status === "live" ? "Live Now" : "Upcoming Meeting"}
              </h3>
              <p className="text-[var(--portal-fg)] font-medium text-sm mb-1 pr-12">
                {meetings[0].title}
              </p>
              <p className="text-[var(--portal-muted)] text-xs mb-3">
                {new Date(meetings[0].scheduled_at).toLocaleString()}
              </p>
              <Link href="/dashboard/meetings">
                <Button variant="outline" size="sm" className="w-full min-h-[40px]">
                  <Radio className="w-4 h-4" />
                  Open Meetings
                </Button>
              </Link>
            </div>
          )}

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--portal-fg)] mb-2">
              Learning Materials
            </h3>
            <p className="text-[var(--portal-muted)] text-xs mb-3">
              {materialsCount} item{materialsCount !== 1 ? "s" : ""} across unlocked courses
            </p>
            <Link href="/dashboard/notes">
              <Button variant="outline" size="sm" className="w-full min-h-[40px] mb-3">
                Open Course Content
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <div className="pt-3 border-t border-[var(--portal-border)]">
              <p className="text-xs text-[var(--portal-muted)] mb-2">Elite Community</p>
              <a href={CONTACT.telegramUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="sm" className="w-full min-h-[40px]">
                  <Send className="w-4 h-4" />
                  {CONTACT.telegram}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <StudentSupportCenter />
    </div>
  );
}
