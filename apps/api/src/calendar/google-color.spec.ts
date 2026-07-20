import {
  DEFAULT_COLOR_ID,
  GOOGLE_EVENT_COLORS,
  nearestGoogleColorId,
} from "./google-color";

describe("nearestGoogleColorId", () => {
  it("maps an exact palette color to its own id", () => {
    for (const { id, hex } of GOOGLE_EVENT_COLORS) {
      expect(nearestGoogleColorId(hex)).toBe(id);
    }
  });

  it("snaps an off-palette color to the nearest entry", () => {
    // A mid-gray -> Graphite (#616161, id 8).
    expect(nearestGoogleColorId("#606060")).toBe("8");
    // A vivid red -> Tomato (#d50000, id 11).
    expect(nearestGoogleColorId("#ff1111")).toBe("11");
    // The app's default indigo (#6366f1) -> Lavender (#7986cb, id 1).
    expect(nearestGoogleColorId("#6366f1")).toBe("1");
  });

  it("is case- and hash-insensitive", () => {
    expect(nearestGoogleColorId("D50000")).toBe("11");
    expect(nearestGoogleColorId("#D50000")).toBe("11");
  });

  it("falls back to the default for unparseable input", () => {
    for (const bad of ["", "not-a-color", "#fff", "#12345"]) {
      expect(nearestGoogleColorId(bad)).toBe(DEFAULT_COLOR_ID);
    }
  });
});
