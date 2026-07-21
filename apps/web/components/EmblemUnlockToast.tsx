"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Emblem } from "../lib/api";
import { useEmblems } from "../lib/emblems-context";
import { useNewlyEarnedEmblems } from "../lib/useNewlyEarnedEmblems";
import { EmblemBadge } from "./EmblemBadge";

const AUTO_ADVANCE_MS = 5000;

// One queued celebration: either a single earned emblem or the "+N more"
// summary that collapses the overflow beyond the queue cap.
type ToastEntry =
  | { kind: "emblem"; id: string; emblem: Emblem }
  | { kind: "summary"; id: string; extra: number };

/**
 * App-wide host for emblem unlock celebrations. Consumes the shared emblems
 * context and is the SOLE caller of useNewlyEarnedEmblems (so it owns the
 * seen-set). Newly-earned emblems are shown one at a time as a celebratory
 * toast; overflow beyond the cap collapses into a final "+N more" summary.
 */
export function EmblemUnlockToastHost() {
  const { emblems } = useEmblems();
  const queue = useNewlyEarnedEmblems(emblems.emblems);
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Enqueue each freshly-detected batch. The hook only surfaces a new queue
  // object when there is something new, so this never re-enqueues a batch.
  useEffect(() => {
    if (queue.items.length === 0) return;
    const batch: ToastEntry[] = queue.items.map((emblem) => ({
      kind: "emblem",
      id: emblem.key,
      emblem,
    }));
    if (queue.extra > 0) {
      batch.push({ kind: "summary", id: "summary", extra: queue.extra });
    }
    setEntries((prev) => [...prev, ...batch]);
  }, [queue]);

  const current = entries[0];

  // Auto-advance the head after a beat; manual dismiss does the same.
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(
      () => setEntries((prev) => prev.slice(1)),
      AUTO_ADVANCE_MS,
    );
    return () => clearTimeout(timer);
  }, [current]);

  if (!mounted || !current) return null;

  return createPortal(
    <EmblemUnlockToast
      entry={current}
      onDismiss={() => setEntries((prev) => prev.slice(1))}
    />,
    document.body,
  );
}

function EmblemUnlockToast({
  entry,
  onDismiss,
}: {
  entry: ToastEntry;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <AnimatePresence>
        <motion.div
          key={entry.id}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -12 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -8 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 400, damping: 22 }
          }
          role="status"
          aria-live="polite"
          className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-amber-400/40 bg-slate-900/95 px-5 py-4 shadow-xl shadow-amber-500/10 backdrop-blur"
        >
          {entry.kind === "emblem" ? (
            <>
              <EmblemBadge emblem={{ ...entry.emblem, earned: true }} size={52} />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
                  Emblem unlocked
                </p>
                <p className="truncate font-semibold text-slate-100">
                  You earned {entry.emblem.name}!
                </p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
                Emblems unlocked
              </p>
              <p className="font-semibold text-slate-100">
                🎉 +{entry.extra} more emblem{entry.extra === 1 ? "" : "s"} earned!
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-2 shrink-0 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            ✕
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
