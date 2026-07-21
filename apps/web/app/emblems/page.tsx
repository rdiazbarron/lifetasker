"use client";

import { Card } from "@heroui/react";
import { Emblem } from "../../lib/api";
import { useEmblems } from "../../lib/emblems-context";
import { EmblemBadge } from "../../components/EmblemBadge";

const GROUP_LABELS: Record<Emblem["group"], string> = {
  category: "Category milestones",
  streak: "Streaks",
  level: "Lifetime levels",
  "perfect-week": "Perfect weeks",
};

const GROUPS = Object.keys(GROUP_LABELS) as Emblem["group"][];

/**
 * The trophy room: the full emblem catalog rendered as artwork, grouped by
 * type, with per-tier progress and an overall earned/available total. Reads
 * the shared emblems context so it never issues its own request.
 */
export default function EmblemsPage() {
  const {
    emblems: { emblems, earnedCount, total },
  } = useEmblems();

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100">Emblems</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your collection of achievements across every group.
          </p>
        </div>
        <span className="w-fit rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
          {earnedCount}/{total} earned
        </span>
      </div>

      {GROUPS.map((group) => {
        const items = emblems.filter((e) => e.group === group);
        if (items.length === 0) return null;
        return (
          <Card
            key={group}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-100">
                {GROUP_LABELS[group]}
              </h2>
              <span className="text-xs text-slate-500">
                {items.filter((e) => e.earned).length}/{items.length}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              {items.map((e) => (
                <div
                  key={e.key}
                  title={e.description}
                  className={
                    e.earned
                      ? "flex w-28 flex-col items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-center"
                      : "flex w-28 flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center"
                  }
                >
                  <EmblemBadge emblem={e} size={56} />
                  <span
                    className={
                      e.earned
                        ? "text-xs font-medium text-amber-200"
                        : "text-xs text-slate-400"
                    }
                  >
                    {e.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {e.earned ? "Earned" : `${e.current}/${e.target}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </main>
  );
}
