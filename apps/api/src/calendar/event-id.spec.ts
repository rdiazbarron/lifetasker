import { calendarEventId } from "./event-id";

describe("calendarEventId", () => {
  it("is deterministic: the same completion id always maps to the same event id", () => {
    const id = "ckuchild000cuidexample1234";
    expect(calendarEventId(id)).toBe(calendarEventId(id));
  });

  it("maps different completion ids to different event ids", () => {
    expect(calendarEventId("completion-a")).not.toBe(
      calendarEventId("completion-b"),
    );
  });

  it("produces only Google-legal base32hex characters", () => {
    // Google allows lowercase a-v and digits 0-9 in event ids.
    const id = calendarEventId("cuidWithMixedCaseAndZ_symbols");
    expect(id).toMatch(/^[a-v0-9]+$/);
  });

  it("stays within Google's 5–1024 character bounds", () => {
    const id = calendarEventId("x");
    expect(id.length).toBeGreaterThanOrEqual(5);
    expect(id.length).toBeLessThanOrEqual(1024);
  });
});
