/**
 * Maps a count of completed blocks in a week to a level (1–4).
 * Thresholds live here as named constants so the formula is testable with
 * plain inputs and tunable in one place.
 */
export const LEVEL_THRESHOLDS = [
  { level: 4, minCompleted: 15 },
  { level: 3, minCompleted: 9 },
  { level: 2, minCompleted: 4 },
  { level: 1, minCompleted: 0 },
] as const;

export const LevelCalculator = {
  compute(completedBlocks: number): number {
    const match = LEVEL_THRESHOLDS.find(
      (t) => completedBlocks >= t.minCompleted,
    );
    return match?.level ?? 1;
  },
};
