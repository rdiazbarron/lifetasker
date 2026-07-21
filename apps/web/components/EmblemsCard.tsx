"use client";

import { Card } from "@heroui/react";
import Link from "next/link";
import { Emblem, Emblems } from "../lib/api";
import { EmblemBadge } from "./EmblemBadge";

const HIGHLIGHT_COUNT = 6;

// A compact set for the dashboard: earned emblems first, then the unearned ones
// closest to completion, so the card previews both wins and near-misses. The
// full catalog lives on the /emblems showcase.
function highlights(emblems: Emblem[]): Emblem[] {
  const earned = emblems.filter((e) => e.earned);
  const nearest = emblems
    .filter((e) => !e.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target);
  return [...earned, ...nearest].slice(0, HIGHLIGHT_COUNT);
}

export function EmblemsCard({ emblems: data }: { emblems: Emblems }) {
  const { emblems, earnedCount, total } = data;
  const preview = highlights(emblems);

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Emblems</h3>
        <span className="text-sm text-slate-400">
          {earnedCount}/{total} earned
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {preview.map((e) => (
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

      <div className="mt-4 flex justify-end">
        <Link
          href="/emblems"
          className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
        >
          View all →
        </Link>
      </div>
    </Card>
  );
}
