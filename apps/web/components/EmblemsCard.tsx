"use client";

import { Card } from "@heroui/react";
import Link from "next/link";
import { Emblem, Emblems } from "../lib/api";
import { EmblemTile } from "./EmblemTile";

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
          <EmblemTile key={e.key} emblem={e} variant="compact" />
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
