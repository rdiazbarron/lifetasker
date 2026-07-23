"use client";

import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { api, DayCompletion } from "../lib/api";
import { ModalShell } from "./ModalShell";

// Format the YYYY-MM-DD key (a UTC calendar day) as a friendly heading. Parsed
// and formatted in UTC so the label matches the heatmap cell that was clicked,
// with no timezone off-by-one.
function formatDay(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// History detail for one day: the list of activities completed on `date`, each
// with its category colour, duration, and — the point of the feature — the note
// the user wrote ("what did I do?"). Fetches on open.
export function DayActivitiesModal({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<DayCompletion[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setItems(null);
    setError("");
    api
      .getDayCompletions(date)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(() => {
        if (active) setError("Couldn't load this day.");
      });
    return () => {
      active = false;
    };
  }, [date]);

  const count = items?.length ?? 0;
  const subtitle =
    items === null
      ? undefined
      : count === 0
        ? "Nothing logged this day."
        : `${count} ${count === 1 ? "activity" : "activities"} completed.`;

  return (
    <ModalShell title={formatDay(date)} subtitle={subtitle} onClose={onClose}>
      {items === null ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : count === 0 ? (
        <p className="text-sm text-slate-400">No completions on this day.</p>
      ) : (
        <ul className="max-h-96 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.blockType.category.color }}
                    aria-hidden
                  />
                  <span className="font-medium text-slate-100">
                    {item.blockType.name}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatTime(item.completedAt)}
                </span>
              </div>
              <p className="mt-1 pl-[1.125rem] text-xs text-slate-500">
                {item.blockType.category.name} • {item.blockType.durationMinutes}{" "}
                min
              </p>
              {item.notes && (
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-slate-700 pl-3 text-sm italic text-slate-300">
                  {item.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
