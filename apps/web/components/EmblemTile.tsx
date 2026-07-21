"use client";

import { Emblem } from "../lib/api";
import { EmblemBadge } from "./EmblemBadge";

/**
 * One emblem rendered as a bordered tile: artwork, name, and progress. Shared
 * by the dashboard summary (`compact`) and the /emblems showcase (`full`) so
 * the two stay visually in step. Locked tiles always show `current/target`;
 * an earned tile shows "Earned" in `full` and nothing in `compact`.
 */
export function EmblemTile({
  emblem,
  variant = "full",
}: {
  emblem: Emblem;
  variant?: "compact" | "full";
}) {
  const compact = variant === "compact";
  const box = compact ? "w-24 gap-1 p-2" : "w-28 gap-1 p-3";

  return (
    <div
      title={
        emblem.earned
          ? `${emblem.description} — earned`
          : `${emblem.description} — ${emblem.current}/${emblem.target}`
      }
      className={`flex flex-col items-center rounded-xl border text-center ${box} ${
        emblem.earned
          ? "border-amber-400/30 bg-amber-500/10"
          : "border-slate-700 bg-slate-950/60"
      }`}
    >
      <EmblemBadge emblem={emblem} size={compact ? 48 : 56} />
      <span
        className={
          emblem.earned
            ? "text-xs font-medium text-amber-200"
            : "text-xs text-slate-400"
        }
      >
        {emblem.name}
      </span>
      {!emblem.earned ? (
        <span className="text-[10px] text-slate-500">
          {emblem.current}/{emblem.target}
        </span>
      ) : (
        !compact && <span className="text-[10px] text-slate-500">Earned</span>
      )}
    </div>
  );
}
