import { DEMO_COURSES } from "@/lib/data/demo-data";

export type PlanTier = "foundation" | "pro" | "elite";

const TIER_RANK: Record<PlanTier, number> = {
  foundation: 1,
  pro: 2,
  elite: 3,
};

export function getHighestPlanTier(courseIds: string[]): PlanTier | null {
  let best: PlanTier | null = null;
  let bestRank = 0;

  for (const course of DEMO_COURSES) {
    if (!courseIds.includes(course.id)) continue;
    const tier = course.slug as PlanTier;
    const rank = TIER_RANK[tier] ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      best = tier;
    }
  }

  return best;
}

export function planTierLabel(tier: PlanTier | null): string {
  if (!tier) return "Free Explorer";
  if (tier === "foundation") return "Foundation";
  if (tier === "pro") return "PRO Member";
  return "ELITE Member";
}
