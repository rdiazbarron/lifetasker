"use client";

import { Card } from "@heroui/react";
import { useEffect, useState } from "react";
import { Emblem, Emblems } from "../lib/api";

const GROUP_LABELS: Record<Emblem["group"], string> = {
  category: "Category milestones",
  streak: "Streaks",
  level: "Lifetime levels",
  "perfect-week": "Perfect weeks",
};

const SEEN_KEY = "lifetasker.seen-emblems";

export function EmblemsCard({ emblems: data }: { emblems: Emblems }) {
  const { emblems, earnedCount, total } = data;
  const [newlyEarned, setNewlyEarned] = useState<Emblem[]>([]);

  // Surface emblems earned since the last visit, then remember them as seen.
  useEffect(() => {
    const earnedKeys = emblems.filter((e) => e.earned).map((e) => e.key);
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      seen = [];
    }
    const seenSet = new Set(seen);
    const fresh = emblems.filter((e) => e.earned && !seenSet.has(e.key));
    if (fresh.length > 0) setNewlyEarned(fresh);
    localStorage.setItem(SEEN_KEY, JSON.stringify(earnedKeys));
  }, [emblems]);

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
              <div className="flex flex-wrap gap-2">
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
                        ? "rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-200"
                        : "rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-500"
                    }
                  >
                    {e.earned ? "🏅 " : "🔒 "}
                    {e.name}
                    {!e.earned && (
                      <span className="ml-1 text-xs text-slate-600">
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
