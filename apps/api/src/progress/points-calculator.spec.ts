import {
  BASE_MINUTES_PER_POINT,
  MAX_WEIGHT_PERCENT,
  PointsCalculator,
} from "./points-calculator";

describe("PointsCalculator", () => {
  it("awards one base point per quarter-hour with no bonus", () => {
    expect(PointsCalculator.compute(BASE_MINUTES_PER_POINT, 0)).toBe(1);
    expect(PointsCalculator.compute(60, 0)).toBe(4);
    expect(PointsCalculator.compute(90, 0)).toBe(6);
  });

  it("applies the category weight as a percentage bonus", () => {
    // 60 min = 4 base points; +20% = 4.8 -> 5.
    expect(PointsCalculator.compute(60, 20)).toBe(5);
    // 90 min = 6 base points; +50% = 9.
    expect(PointsCalculator.compute(90, 50)).toBe(9);
  });

  it("rounds to the nearest whole point", () => {
    // 50 min / 15 = 3.33 base points, no bonus -> 3.
    expect(PointsCalculator.compute(50, 0)).toBe(3);
    // 50 / 15 = 3.33 * 1.2 = 4.0 -> 4.
    expect(PointsCalculator.compute(50, 20)).toBe(4);
  });

  it("caps the weight at the maximum bonus", () => {
    // Weight above the cap is clamped: 60 min at +100% (the cap) doubles to 8.
    const atCap = PointsCalculator.compute(60, MAX_WEIGHT_PERCENT);
    const overCap = PointsCalculator.compute(60, 500);
    expect(atCap).toBe(8);
    expect(overCap).toBe(atCap);
  });

  it("never awards negative points for junk input", () => {
    expect(PointsCalculator.compute(0, 50)).toBe(0);
    expect(PointsCalculator.compute(-30, 50)).toBe(0);
    expect(PointsCalculator.compute(60, -50)).toBe(4);
  });
});
