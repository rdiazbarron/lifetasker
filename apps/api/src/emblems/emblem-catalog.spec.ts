import { evaluateEmblems, longestStreak } from "./emblem-catalog";

describe("longestStreak", () => {
  it("is zero for no active days", () => {
    expect(longestStreak([])).toBe(0);
  });

  it("counts a single day as a streak of one", () => {
    expect(longestStreak(["2026-07-05"])).toBe(1);
  });

  it("finds the longest consecutive run regardless of order or duplicates", () => {
    // 01,02,03 (run 3), gap, 05, gap, 08,09
    expect(
      longestStreak([
        "2026-07-09",
        "2026-07-02",
        "2026-07-01",
        "2026-07-03",
        "2026-07-03", // duplicate
        "2026-07-05",
        "2026-07-08",
      ]),
    ).toBe(3);
  });

  it("handles month boundaries", () => {
    expect(longestStreak(["2026-06-30", "2026-07-01", "2026-07-02"])).toBe(3);
  });
});

describe("evaluateEmblems", () => {
  const base = {
    categories: [{ id: "cat1", name: "Study", color: "#abcdef" }],
    categoryCounts: {} as Record<string, number>,
    longestStreakDays: 0,
    lifetimeLevel: 1,
    perfectWeeks: 0,
  };

  const find = (emblems: ReturnType<typeof evaluateEmblems>, key: string) =>
    emblems.find((e) => e.key === key)!;

  it("earns a category-count tier when the count reaches it", () => {
    const emblems = evaluateEmblems({ ...base, categoryCounts: { cat1: 50 } });
    expect(find(emblems, "category:cat1:10").earned).toBe(true);
    expect(find(emblems, "category:cat1:50").earned).toBe(true);
    expect(find(emblems, "category:cat1:100").earned).toBe(false);
    expect(find(emblems, "category:cat1:100").current).toBe(50);
  });

  it("earns streak tiers by longest run", () => {
    const emblems = evaluateEmblems({ ...base, longestStreakDays: 30 });
    expect(find(emblems, "streak:7").earned).toBe(true);
    expect(find(emblems, "streak:30").earned).toBe(true);
    expect(find(emblems, "streak:100").earned).toBe(false);
  });

  it("earns level milestones by lifetime level", () => {
    const emblems = evaluateEmblems({ ...base, lifetimeLevel: 10 });
    expect(find(emblems, "level:5").earned).toBe(true);
    expect(find(emblems, "level:10").earned).toBe(true);
    expect(find(emblems, "level:25").earned).toBe(false);
  });

  it("earns perfect-week tiers by count of perfect weeks", () => {
    const emblems = evaluateEmblems({ ...base, perfectWeeks: 1 });
    expect(find(emblems, "perfect-week:1").earned).toBe(true);
    expect(find(emblems, "perfect-week:4").earned).toBe(false);
  });

  it("emits count tiers per category", () => {
    const emblems = evaluateEmblems({
      ...base,
      categories: [
        { id: "a", name: "Study", color: "#111111" },
        { id: "b", name: "Sport", color: "#222222" },
      ],
    });
    expect(emblems.filter((e) => e.group === "category")).toHaveLength(6); // 2 cats * 3 tiers
  });

  it("derives the art key as `${group}-${rank}` with rank following tier order", () => {
    const emblems = evaluateEmblems(base);
    // Category tiers 10/50/100 -> ranks 1/2/3.
    expect(find(emblems, "category:cat1:10").art).toBe("category-1");
    expect(find(emblems, "category:cat1:50").art).toBe("category-2");
    expect(find(emblems, "category:cat1:100").art).toBe("category-3");
    // Streak tiers 7/30/100 -> ranks 1/2/3.
    expect(find(emblems, "streak:7").art).toBe("streak-1");
    expect(find(emblems, "streak:30").art).toBe("streak-2");
    expect(find(emblems, "streak:100").art).toBe("streak-3");
    // Level tiers 5/10/25 -> ranks 1/2/3.
    expect(find(emblems, "level:5").art).toBe("level-1");
    expect(find(emblems, "level:25").art).toBe("level-3");
    // Perfect-week tiers 1/4/12 -> ranks 1/2/3.
    expect(find(emblems, "perfect-week:1").art).toBe("perfect-week-1");
    expect(find(emblems, "perfect-week:12").art).toBe("perfect-week-3");
  });

  it("tints category emblems with the category color and leaves others null", () => {
    const emblems = evaluateEmblems(base);
    expect(find(emblems, "category:cat1:10").color).toBe("#abcdef");
    expect(find(emblems, "streak:7").color).toBeNull();
    expect(find(emblems, "level:5").color).toBeNull();
    expect(find(emblems, "perfect-week:1").color).toBeNull();
  });
});
