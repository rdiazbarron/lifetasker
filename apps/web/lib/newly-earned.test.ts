import { describe, expect, it } from "vitest";
import { Emblem } from "./api";
import { detectNewlyEarned, seenKeyFor, shapeQueue } from "./newly-earned";

const emblem = (key: string, earned: boolean): Emblem => ({
  key,
  group: "category",
  name: key,
  description: key,
  target: 10,
  current: earned ? 10 : 0,
  earned,
  art: "category-1",
  color: null,
});

describe("seenKeyFor", () => {
  it("namespaces the seen-set per user", () => {
    expect(seenKeyFor("a")).not.toBe(seenKeyFor("b"));
    expect(seenKeyFor("a")).toBe("lifetasker.seen-emblems:a");
  });
});

describe("detectNewlyEarned", () => {
  it("seeds silently on the first visit (no stored set)", () => {
    const emblems = [emblem("x", true), emblem("y", true), emblem("z", false)];
    const result = detectNewlyEarned(null, emblems);

    expect(result.fresh).toEqual([]);
    expect(result.queue.items).toEqual([]);
    // The whole earned backlog is recorded as seen, silently.
    expect(JSON.parse(result.nextSeen)).toEqual(["x", "y"]);
  });

  it("returns only emblems earned since the stored set", () => {
    const emblems = [emblem("x", true), emblem("y", true)];
    const stored = JSON.stringify(["x"]);
    const result = detectNewlyEarned(stored, emblems);

    expect(result.fresh.map((e) => e.key)).toEqual(["y"]);
  });

  it("marks every earned emblem as seen, so a follow-up call is empty", () => {
    const emblems = [emblem("x", true), emblem("y", true)];
    const first = detectNewlyEarned(JSON.stringify(["x"]), emblems);
    expect(first.fresh.map((e) => e.key)).toEqual(["y"]);

    // Feed the persisted set back in — nothing is fresh the second time.
    const second = detectNewlyEarned(first.nextSeen, emblems);
    expect(second.fresh).toEqual([]);
  });

  it("treats a malformed stored value as an empty seen-set", () => {
    const emblems = [emblem("x", true)];
    const result = detectNewlyEarned("not json", emblems);
    expect(result.fresh.map((e) => e.key)).toEqual(["x"]);
  });

  it("ignores unearned emblems entirely", () => {
    const emblems = [emblem("x", false), emblem("y", false)];
    const result = detectNewlyEarned(JSON.stringify([]), emblems);
    expect(result.fresh).toEqual([]);
  });
});

describe("shapeQueue", () => {
  it("caps individual entries and summarises the remainder", () => {
    const fresh = ["a", "b", "c", "d", "e"].map((k) => emblem(k, true));
    const queue = shapeQueue(fresh, 3);
    expect(queue.items.map((e) => e.key)).toEqual(["a", "b", "c"]);
    expect(queue.extra).toBe(2);
  });

  it("has no remainder when fresh fits within the cap", () => {
    const fresh = [emblem("a", true)];
    const queue = shapeQueue(fresh, 3);
    expect(queue.items).toHaveLength(1);
    expect(queue.extra).toBe(0);
  });
});
