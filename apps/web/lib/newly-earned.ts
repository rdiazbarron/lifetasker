import { Emblem } from "./api";

/**
 * Pure detection of newly-earned emblems, extracted from the React hook so the
 * logic is testable without a DOM or localStorage. The hook is a thin wrapper
 * that reads/writes the browser store and hands the raw value here.
 *
 * Two behaviours matter and are covered by tests:
 *  - Silent first-visit seed: with no stored set (first ever load for a user),
 *    the whole retroactive backlog is recorded as seen WITHOUT being surfaced,
 *    so a returning user isn't hit by a wall of celebrations.
 *  - Marks-seen-once: `nextSeen` always reflects every currently-earned key, so
 *    feeding it back in on the next call yields no fresh emblems.
 */

// Per-user storage key so a shared browser never leaks one account's seen set
// to another signed-in account.
export const seenKeyFor = (userId: string) => `lifetasker.seen-emblems:${userId}`;

export const DEFAULT_QUEUE_CAP = 3;

export type UnlockQueue = {
  // Emblems shown as individual celebratory toasts, capped at the cap.
  items: Emblem[];
  // How many additional emblems are collapsed into a "+N more" summary.
  extra: number;
};

export type NewlyEarnedResult = {
  // Emblems earned since the stored seen-set (empty on the silent first visit).
  fresh: Emblem[];
  // JSON string to persist as the new seen-set.
  nextSeen: string;
  // Display-shaped queue derived from `fresh`.
  queue: UnlockQueue;
};

export function shapeQueue(fresh: Emblem[], cap = DEFAULT_QUEUE_CAP): UnlockQueue {
  return {
    items: fresh.slice(0, cap),
    extra: Math.max(0, fresh.length - cap),
  };
}

export function detectNewlyEarned(
  stored: string | null,
  emblems: Emblem[],
  cap = DEFAULT_QUEUE_CAP,
): NewlyEarnedResult {
  const earnedKeys = emblems.filter((e) => e.earned).map((e) => e.key);
  const nextSeen = JSON.stringify(earnedKeys);

  // First ever visit for this user: seed silently, celebrate nothing.
  if (stored === null) {
    return { fresh: [], nextSeen, queue: shapeQueue([]) };
  }

  let seen: string[] = [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) seen = parsed;
  } catch {
    seen = [];
  }
  const seenSet = new Set(seen);
  const fresh = emblems.filter((e) => e.earned && !seenSet.has(e.key));

  return { fresh, nextSeen, queue: shapeQueue(fresh, cap) };
}
