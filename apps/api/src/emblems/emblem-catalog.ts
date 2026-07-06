/**
 * The emblem catalog: GitHub-achievement-style badges, defined as pure
 * predicates over a user's completion and plan history. Because eligibility is
 * derived purely from aggregated history, emblems are inherently retroactive —
 * a user who already qualifies has them from the moment the feature ships.
 *
 * Tiers live here as named constants so they are tunable in one place and the
 * evaluation is testable with plain inputs (mirrors the calculator modules).
 *
 * Note (AGENTS.md guardrail): LifeTasker avoids daily-streak mechanics as the
 * PRIMARY loop. Streak emblems are one secondary reward group among several;
 * the weekly-flex model stays central.
 */
export const CATEGORY_COUNT_TIERS = [10, 50, 100];
export const STREAK_TIERS = [7, 30, 100];
export const LEVEL_TIERS = [5, 10, 25];
export const PERFECT_WEEK_TIERS = [1, 4, 12];

export type EmblemGroup = "category" | "streak" | "level" | "perfect-week";

export type EmblemInput = {
  categories: Array<{ id: string; name: string }>;
  categoryCounts: Record<string, number>;
  longestStreakDays: number;
  lifetimeLevel: number;
  perfectWeeks: number;
};

export type Emblem = {
  key: string;
  group: EmblemGroup;
  name: string;
  description: string;
  target: number;
  current: number;
  earned: boolean;
};

/**
 * Longest run of consecutive calendar days present in the input. Days are
 * `YYYY-MM-DD` strings; duplicates and ordering don't matter.
 */
export function longestStreak(activeDays: string[]): number {
  const days = Array.from(new Set(activeDays)).sort();
  if (days.length === 0) return 0;

  const DAY_MS = 86_400_000;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = Date.parse(`${days[i - 1]}T00:00:00.000Z`);
    const cur = Date.parse(`${days[i]}T00:00:00.000Z`);
    run = cur - prev === DAY_MS ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

export function evaluateEmblems(input: EmblemInput): Emblem[] {
  const emblems: Emblem[] = [];

  for (const category of input.categories) {
    const count = input.categoryCounts[category.id] ?? 0;
    for (const tier of CATEGORY_COUNT_TIERS) {
      emblems.push({
        key: `category:${category.id}:${tier}`,
        group: "category",
        name: `${category.name} ×${tier}`,
        description: `Complete ${tier} ${category.name} blocks`,
        target: tier,
        current: count,
        earned: count >= tier,
      });
    }
  }

  for (const tier of STREAK_TIERS) {
    emblems.push({
      key: `streak:${tier}`,
      group: "streak",
      name: `${tier}-day streak`,
      description: `Stay active ${tier} days in a row`,
      target: tier,
      current: input.longestStreakDays,
      earned: input.longestStreakDays >= tier,
    });
  }

  for (const tier of LEVEL_TIERS) {
    emblems.push({
      key: `level:${tier}`,
      group: "level",
      name: `Level ${tier}`,
      description: `Reach lifetime level ${tier}`,
      target: tier,
      current: input.lifetimeLevel,
      earned: input.lifetimeLevel >= tier,
    });
  }

  for (const tier of PERFECT_WEEK_TIERS) {
    emblems.push({
      key: `perfect-week:${tier}`,
      group: "perfect-week",
      name: tier === 1 ? "Perfect week" : `${tier} perfect weeks`,
      description: `Hit 100% of your plan in ${tier} week${tier > 1 ? "s" : ""}`,
      target: tier,
      current: input.perfectWeeks,
      earned: input.perfectWeeks >= tier,
    });
  }

  return emblems;
}
