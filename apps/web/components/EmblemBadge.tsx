"use client";

import { Emblem } from "../lib/api";

/**
 * Renders an emblem as inline SVG artwork keyed by its `art` string
 * (`${group}-${rank}`, rank 1..3). One SVG per key, CSS-toggled between locked
 * and earned: locked emblems are grayscale + dimmed with the tint suppressed;
 * earned emblems are full-color. Accent fills use `currentColor` so a category
 * medal picks up its category color and a locked medal inherits gray.
 *
 * The API ships only the `art` key and `color`; all artwork lives here.
 */

type Group = Emblem["group"];

// Ring metal per tier rank — higher ranks read as more prestigious.
const RANK_METAL: Record<number, string> = {
  1: "#b87333", // bronze
  2: "#cbd5e1", // silver
  3: "#fbbf24", // gold
};

// Fallback accent per group when no category color applies (streak/level/
// perfect-week). Category emblems override this with their own color.
const GROUP_ACCENT: Record<Group, string> = {
  category: "#38bdf8",
  streak: "#f59e0b",
  level: "#8b5cf6",
  "perfect-week": "#10b981",
};

const LOCKED_ACCENT = "#64748b"; // slate-500

function parseArt(art: string): { group: Group; rank: number } {
  const rank = Number(art.slice(-1));
  const group = art.slice(0, -2) as Group;
  return { group, rank };
}

// The per-group motif, drawn in `currentColor` so the wrapper's color controls
// the tint (and grayscale/locked state).
function Motif({ group }: { group: Group }) {
  switch (group) {
    case "streak":
      // Flame.
      return (
        <path
          d="M32 12c2 7 9 9 9 17a9 9 0 0 1-18 0c0-3 1-5 2-6 0 3 2 4 4 4-3-6 1-10 3-15Z"
          fill="currentColor"
        />
      );
    case "level":
      // Five-point star.
      return (
        <path
          d="M32 13l5.3 10.7 11.8 1.7-8.5 8.3 2 11.7L32 41.6 21.4 47.1l2-11.7-8.5-8.3 11.8-1.7z"
          fill="currentColor"
        />
      );
    case "perfect-week":
      // Trophy cup.
      return (
        <path
          d="M23 15h18v6a9 9 0 0 1-18 0v-6zm-4 2h4v4h-1a3 3 0 0 1-3-3v-1zm22 0h4v1a3 3 0 0 1-3 3h-1v-4zM30 30h4v6h-4zm-5 6h14v3H25z"
          fill="currentColor"
        />
      );
    case "category":
    default:
      // Medal disc with a center pip.
      return (
        <>
          <circle cx="32" cy="30" r="11" fill="currentColor" opacity="0.85" />
          <circle cx="32" cy="30" r="4.5" fill="#0f172a" opacity="0.35" />
        </>
      );
  }
}

export function EmblemBadge({
  emblem,
  size = 56,
}: {
  emblem: Pick<Emblem, "art" | "color" | "earned" | "name">;
  size?: number;
}) {
  const { group, rank } = parseArt(emblem.art);
  const accent = emblem.earned
    ? emblem.color ?? GROUP_ACCENT[group]
    : LOCKED_ACCENT;
  const metal = emblem.earned ? RANK_METAL[rank] ?? RANK_METAL[1] : LOCKED_ACCENT;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={emblem.name}
      className={emblem.earned ? "" : "opacity-50 grayscale"}
      style={{ color: accent }}
    >
      {/* Tier ring — its metal color signals prestige. */}
      <circle
        cx="32"
        cy="30"
        r="18"
        fill="none"
        stroke={metal}
        strokeWidth="3"
      />
      <Motif group={group} />
      {/* Rank pips: one dot per tier rank, in the ring metal. */}
      {Array.from({ length: rank }).map((_, i) => (
        <circle
          key={i}
          cx={32 + (i - (rank - 1) / 2) * 7}
          cy="54"
          r="2.5"
          fill={metal}
        />
      ))}
    </svg>
  );
}
