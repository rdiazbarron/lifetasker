import { computeEventWindow } from "./event-window";

describe("computeEventWindow", () => {
  it("ends at completion time and starts one duration earlier", () => {
    const completedAt = new Date("2026-07-19T15:00:00.000Z");
    const { start, end } = computeEventWindow(completedAt, 90);

    expect(end.toISOString()).toBe("2026-07-19T15:00:00.000Z");
    // 90 minutes before 15:00 is 13:30.
    expect(start.toISOString()).toBe("2026-07-19T13:30:00.000Z");
  });

  it("places a backdated completion's window in the past", () => {
    const completedAt = new Date("2026-01-02T08:00:00.000Z");
    const { start, end } = computeEventWindow(completedAt, 60);

    expect(end.toISOString()).toBe("2026-01-02T08:00:00.000Z");
    expect(start.toISOString()).toBe("2026-01-02T07:00:00.000Z");
  });

  it("does not mutate the passed-in date", () => {
    const completedAt = new Date("2026-07-19T15:00:00.000Z");
    computeEventWindow(completedAt, 45);
    expect(completedAt.toISOString()).toBe("2026-07-19T15:00:00.000Z");
  });

  it("collapses to a zero-length window for junk durations", () => {
    const completedAt = new Date("2026-07-19T15:00:00.000Z");
    for (const bad of [0, -30, NaN]) {
      const { start, end } = computeEventWindow(completedAt, bad);
      expect(start.getTime()).toBe(end.getTime());
      expect(end.toISOString()).toBe("2026-07-19T15:00:00.000Z");
    }
  });
});
