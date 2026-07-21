"use client";

import { Card } from "@heroui/react";
import { Emblem, Emblems } from "../lib/api";
import { EmblemBadge } from "./EmblemBadge";

const GROUP_LABELS: Record<Emblem["group"], string> = {
  category: "Category milestones",
  streak: "Streaks",
  level: "Lifetime levels",
  "perfect-week": "Perfect weeks",
};

export function EmblemsCard({ emblems: data }: { emblems: Emblems }) {
  const { emblems, earnedCount, total } = data;

  const groups = Object.keys(GROUP_LABELS) as Emblem["group"][];

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Emblems</h3>
        <span className="text-sm text-slate-400">
          {earnedCount}/{total} earned
        </span>
      </div>

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
