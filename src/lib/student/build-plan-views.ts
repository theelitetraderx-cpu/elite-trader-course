import { DEMO_COURSES, COURSE_CURRICULUM, PRICING_PLANS } from "@/lib/data/demo-data";
import { getProgramByCourseId } from "@/lib/data/course-content-store";
import type { Course } from "@/types";
import type { AdminModule, CourseProgram } from "@/lib/data/course-hierarchy";
import type { PlanTier } from "@/lib/student/plan-access";

export interface StudentPlanView {
  course: Course;
  tier: PlanTier;
  unlocked: boolean;
  memberPrice: number;
  price: number;
  highlights: string[];
  popular: boolean;
  program: CourseProgram | null;
  publishedModules: AdminModule[];
}

const TIER_ORDER: PlanTier[] = ["foundation", "pro", "elite"];

function moduleHasContent(mod: AdminModule) {
  return mod.videos.length > 0 || mod.ppts.length > 0 || mod.notes.length > 0;
}

export function buildStudentPlanViews(userCourseIds: string[]): StudentPlanView[] {
  return TIER_ORDER.map((tier) => {
    const course = DEMO_COURSES.find((c) => c.slug === tier)!;
    const pricing = PRICING_PLANS.find((p) => p.tier === tier)!;
    const curriculum = COURSE_CURRICULUM[tier];
    const program = getProgramByCourseId(course.id);
    const publishedModules = program?.modules.filter(moduleHasContent) ?? [];

    const stats = program
      ? {
          module_count: program.modules.length,
          lesson_count: program.modules.reduce((n, m) => n + m.videos.length, 0),
          duration_minutes: program.modules.reduce(
            (n, m) => n + m.videos.reduce((s, v) => s + Math.ceil(v.duration_seconds / 60), 0),
            0
          ),
        }
      : null;

    return {
      course: stats
        ? {
            ...course,
            module_count: stats.module_count,
            lesson_count: stats.lesson_count,
            duration_minutes: stats.duration_minutes,
          }
        : course,
      tier,
      unlocked: userCourseIds.includes(course.id),
      memberPrice: curriculum?.memberPrice ?? pricing.memberPrice,
      price: pricing.price,
      highlights: curriculum?.highlights ?? pricing.features.slice(0, 4),
      popular: pricing.popular,
      program: program ?? null,
      publishedModules,
    };
  });
}
