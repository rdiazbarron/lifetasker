"use client";

import { Card, Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { api, Heatmap, hexWithAlpha } from "../lib/api";
import { DayActivitiesModal } from "./DayActivitiesModal";

// Only the fields the picker needs; matches the overview endpoint's category shape.
type PickerCategory = { id: string; name: string; color: string };

const ALL = "all";
// "All activity" mixes categories, so it uses a neutral green rather than any
// single category's color.
const ALL_COLOR = "#10b981";

// Intensity buckets, GitHub-style: 0 / 1 / 2-3 / 4+.
function bucketAlpha(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 0.4;
  if (count <= 3) return 0.7;
  return 1;
}

const parse = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
};

type Cell = { date: string; count: number } | null;

// Lay days out in GitHub's grid: one column per week (Sunday-started), 7 rows.
function buildColumns(data: Heatmap | null): Cell[][] {
  if (!data) return [];
  const counts = new Map(data.days.map((d) => [d.date, d.count]));
  const start = parse(data.start);
  const end = parse(data.end);
  const gridStart = addDays(start, -start.getUTCDay()); // back to Sunday
  const totalDays =
    Math.round((end.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const numCols = Math.ceil(totalDays / 7);

  const columns: Cell[][] = [];
  for (let c = 0; c < numCols; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < 7; r++) {
      const day = addDays(gridStart, c * 7 + r);
      const inRange = day >= start && day <= end;
      const key = fmt(day);
      col.push(inRange ? { date: key, count: counts.get(key) ?? 0 } : null);
    }
    columns.push(col);
  }
  return columns;
}

export function ContributionHeatmap({
  categories,
}: {
  categories: PickerCategory[];
}) {
  const [selected, setSelected] = useState<string>(ALL);
  const [data, setData] = useState<Heatmap | null>(null);
  const [loading, setLoading] = useState(true);
  // The day whose detail modal is open (its completions + notes), or null.
  const [openDay, setOpenDay] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getHeatmap(selected)
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  const baseColor =
    selected === ALL
      ? ALL_COLOR
      : (categories.find((c) => c.id === selected)?.color ?? ALL_COLOR);

  const columns = useMemo(() => buildColumns(data), [data]);

  const cellStyle = (count: number) => {
    const alpha = bucketAlpha(count);
    return alpha === 0
      ? { backgroundColor: "rgba(148, 163, 184, 0.12)" } // slate, empty day
      : { backgroundColor: hexWithAlpha(baseColor, alpha) };
  };

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">Contribution heatmap</h3>
          <p className="mt-1 text-sm text-slate-400">
            Activity over the last 12 months.
          </p>
        </div>
        <select
          aria-label="Heatmap category"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-500"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value={ALL}>All activity</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <div className="flex gap-1">
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-1">
                  {col.map((cell, ri) =>
                    cell === null ? (
                      <div key={ri} className="h-3 w-3" />
                    ) : cell.count > 0 ? (
                      // Days with activity are clickable: open the detail modal
                      // to read what was done (and any notes) that day.
                      <button
                        key={ri}
                        type="button"
                        onClick={() => setOpenDay(cell.date)}
                        aria-label={`${cell.date}: ${cell.count} ${
                          cell.count === 1 ? "block" : "blocks"
                        }`}
                        className="h-3 w-3 cursor-pointer rounded-sm transition hover:ring-2 hover:ring-slate-400/60"
                        style={cellStyle(cell.count)}
                        title={`${cell.date}: ${cell.count} ${
                          cell.count === 1 ? "block" : "blocks"
                        }`}
                      />
                    ) : (
                      <div
                        key={ri}
                        className="h-3 w-3 rounded-sm"
                        style={cellStyle(cell.count)}
                        title={`${cell.date}: 0 blocks`}
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span>Less</span>
            {[0, 1, 2, 4].map((count) => (
              <span
                key={count}
                className="h-3 w-3 rounded-sm"
                style={cellStyle(count)}
                aria-hidden
              />
            ))}
            <span>More</span>
          </div>
        </>
      )}

      {openDay && (
        <DayActivitiesModal date={openDay} onClose={() => setOpenDay(null)} />
      )}
    </Card>
  );
}
