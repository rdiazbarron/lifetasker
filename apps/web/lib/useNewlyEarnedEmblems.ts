"use client";

import { useEffect, useState } from "react";
import { useSession } from "./auth-client";
import { Emblem } from "./api";
import { UnlockQueue, detectNewlyEarned, seenKeyFor, shapeQueue } from "./newly-earned";

/**
 * Detects emblems earned since the user last saw them and returns a capped
 * celebration queue. Owns the per-user localStorage seen-set and marks emblems
 * seen exactly once. Intended to be mounted in ONE place (the app-wide unlock
 * toast host) so it stays the sole writer of the seen-set — other consumers
 * read emblem state, not this hook.
 */
export function useNewlyEarnedEmblems(emblems: Emblem[]): UnlockQueue {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [queue, setQueue] = useState<UnlockQueue>(() => shapeQueue([]));

  useEffect(() => {
    if (!userId) return;
    const key = seenKeyFor(userId);
    const result = detectNewlyEarned(localStorage.getItem(key), emblems);
    localStorage.setItem(key, result.nextSeen);
    if (result.queue.items.length > 0) setQueue(result.queue);
  }, [emblems, userId]);

  return queue;
}
