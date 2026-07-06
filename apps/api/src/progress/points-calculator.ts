/**
 * Computes the points a single completed block is worth.
 *
 * Points scale with the block's duration and are then boosted by the category's
 * importance weight. The result is stored on the BlockInstance at completion
 * time and frozen — editing a category's weight later never re-scores past
 * completions.
 *
 * Constants live here as named exports so the formula is testable with plain
 * inputs and tunable in one place (mirrors level-calculator.ts).
 */

// A quarter-hour of activity is worth one base point before any category bonus.
export const BASE_MINUTES_PER_POINT = 15;

// Category weight is a bonus percent capped at baseline..double (0..100).
export const MAX_WEIGHT_PERCENT = 100;

export const PointsCalculator = {
  compute(durationMinutes: number, weightPercent: number): number {
    // Defensive cap: the API validates 0..100, but the formula must never
    // over-reward if an out-of-range weight ever reaches it.
    const weight = Math.min(MAX_WEIGHT_PERCENT, Math.max(0, weightPercent));
    const base = Math.max(0, durationMinutes) / BASE_MINUTES_PER_POINT;
    const multiplier = 1 + weight / 100;
    return Math.round(base * multiplier);
  },
};
