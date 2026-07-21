"use client";

import { Card } from "@heroui/react";
import { useEffect, useState } from "react";
import { useSession } from "../lib/auth-client";
import { Emblem, Emblems } from "../lib/api";
import { EmblemBadge } from "./EmblemBadge";

const GROUP_LABELS: Record<Emblem["group"], string> = {
  category: "Category milestones",
  streak: "Streaks",
  level: "Lifetime levels",
  "perfect-week": "Perfect weeks",
};

const seenKeyFor = (userId: string) => `lifetasker.seen-emblems:${userId}`;

export function EmblemsCard({ emblems: data }: { emblems: Emblems }) {
  const { emblems, earnedCount, total } = data;
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [newlyEarned, setNewlyEarned] = useState<Emblem[]>([]);

  // Surface emblems earned since the last visit, then remember them as seen.
  // Scoped per user so a shared browser doesn't leak one user's "seen" set to
  // another. On the very first visit (no stored set), seed silently instead of
  // celebrating every retroactively-earned emblem at once.
  useEffect(() => {
    if (!userId) return;
    const seenKey = seenKeyFor(userId);
    const earnedKeys = emblems.filter((e) => e.earned).map((e) => e.key);
    const stored = localStorage.getItem(seenKey);
    if (stored === null) {
      localStorage.setItem(seenKey, JSON.stringify(earnedKeys));
      return;
    }
    let seen: string[] = [];
    try {
      seen = JSON.parse(stored);
    } catch {
      seen = [];
    }
    const seenSet = new Set(seen);
    const fresh = emblems.filter((e) => e.earned && !seenSet.has(e.key));
    if (fresh.length > 0) setNewlyEarned(fresh);
    localStorage.setItem(seenKey, JSON.stringify(earnedKeys));
  }, [emblems, userId]);

  const groups = Object.keys(GROUP_LABELS) as Emblem["group"][];

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Emblems</h3>
        <span className="text-sm text-slate-400">
          {earnedCount}/{total} earned
        </span>
      </div>

      {newlyEarned.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          🎉 New{" "}
          {newlyEarned.length === 1 ? "emblem" : `emblems (${newlyEarned.length})`}
          : {newlyEarned.map((e) => e.name).join(", ")}
        </div>
      )}

      <div className="mt-4 space-y-5">
        {groups.map((group) => {
          const items = emblems.filter((e) => e.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {GROUP_LABELS[group]}
              </p>
              <div className="flex flex-wrap gap-3">
                {items.map((e) => (
                  <div
                    key={e.key}
                    title={
                      e.earned
                        ? `${e.description} — earned`
                        : `${e.description} — ${e.current}/${e.target}`
                    }
                    className={
                      e.earned
                        ? "flex w-24 flex-col items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/10 p-2 text-center"
                        : "flex w-24 flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/60 p-2 text-center"
                    }
                  >
                    <EmblemBadge emblem={e} size={48} />
                    <span
                      className={
                        e.earned
                          ? "text-xs font-medium text-amber-200"
                          : "text-xs text-slate-500"
                      }
                    >
                      {e.name}
                    </span>
                    {!e.earned && (
                      <span className="text-[10px] text-slate-600">
                        {e.current}/{e.target}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
