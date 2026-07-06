import {
  LifetimeLevelCalculator,
  pointsToReachLevel,
} from "./lifetime-level-calculator";

describe("LifetimeLevelCalculator", () => {
  it("uses an escalating curve (L2=100, L3=250, L4=450)", () => {
    expect(pointsToReachLevel(1)).toBe(0);
    expect(pointsToReachLevel(2)).toBe(100);
    expect(pointsToReachLevel(3)).toBe(250);
    expect(pointsToReachLevel(4)).toBe(450);
  });

  it("places points at the correct level", () => {
    expect(LifetimeLevelCalculator.compute(0).level).toBe(1);
    expect(LifetimeLevelCalculator.compute(99).level).toBe(1);
    expect(LifetimeLevelCalculator.compute(100).level).toBe(2);
    expect(LifetimeLevelCalculator.compute(249).level).toBe(2);
    expect(LifetimeLevelCalculator.compute(250).level).toBe(3);
    expect(LifetimeLevelCalculator.compute(450).level).toBe(4);
  });

  it("reports progress toward the next level", () => {
    // 175 points: level 2 (floor 100), next at 250 => 75 into a 150-point band.
    const p = LifetimeLevelCalculator.compute(175);
    expect(p.level).toBe(2);
    expect(p.pointsIntoLevel).toBe(75);
    expect(p.pointsForNextLevel).toBe(150);
    expect(p.pointsToNextLevel).toBe(75);
    expect(p.progressPercent).toBe(50);
  });

  it("is exactly at a level floor with zero progress into it", () => {
    const p = LifetimeLevelCalculator.compute(100);
    expect(p.level).toBe(2);
    expect(p.pointsIntoLevel).toBe(0);
    expect(p.progressPercent).toBe(0);
    expect(p.pointsToNextLevel).toBe(150);
  });

  it("clamps junk input to zero points at level 1", () => {
    expect(LifetimeLevelCalculator.compute(-50).level).toBe(1);
    expect(LifetimeLevelCalculator.compute(-50).totalPoints).toBe(0);
  });
});
