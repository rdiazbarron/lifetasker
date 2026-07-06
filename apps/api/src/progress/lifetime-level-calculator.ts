/**
 * Maps a user's total lifetime points to a level on an escalating (RPG-style)
 * curve: each successive level costs more cumulative points than the last, so
 * early levels come quickly and later ones feel earned.
 *
 * The cumulative points required to REACH level L is
 *   T(L) = BASE * (L * (L + 1) / 2 - 1)
 * which yields increments of 100, 150, 200, ... — i.e. T(2)=100, T(3)=250,
 * T(4)=450 with BASE=50. Kept here as a pure function so it is testable with
 * plain inputs and tunable in one place (mirrors level-calculator.ts).
 */
export const LIFETIME_LEVEL_BASE = 50;

export function pointsToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return LIFETIME_LEVEL_BASE * ((level * (level + 1)) / 2 - 1);
}

export type LifetimeProgress = {
  level: number;
  totalPoints: number;
  pointsIntoLevel: number;
  pointsForNextLevel: number;
  pointsToNextLevel: number;
  progressPercent: number;
};

export const LifetimeLevelCalculator = {
  compute(totalPoints: number): LifetimeProgress {
    const points = Math.max(0, Math.floor(totalPoints));

    let level = 1;
    while (pointsToReachLevel(level + 1) <= points) {
      level++;
    }

    const currentFloor = pointsToReachLevel(level);
    const nextThreshold = pointsToReachLevel(level + 1);
    const pointsForNextLevel = nextThreshold - currentFloor;
    const pointsIntoLevel = points - currentFloor;

    return {
      level,
      totalPoints: points,
      pointsIntoLevel,
      pointsForNextLevel,
      pointsToNextLevel: nextThreshold - points,
      progressPercent: Math.round((pointsIntoLevel / pointsForNextLevel) * 100),
    };
  },
};
