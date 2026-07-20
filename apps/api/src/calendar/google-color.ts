/**
 * Maps a category's stored hex color (#24) onto Google Calendar's fixed event
 * color palette.
 *
 * The Calendar API does not accept arbitrary hex for events — only one of 11
 * predefined `colorId`s. We therefore pick the palette entry nearest to the
 * category color by Euclidean distance in RGB. It is an approximation by
 * design (documented as such in #33), so the calendar stays visually close to
 * the app without pretending to match exactly.
 *
 * Pure and dependency-free so the mapping is unit-tested in isolation
 * (google-color.spec.ts).
 */

/** The 11 Google Calendar event colors, by their API `colorId`. */
export const GOOGLE_EVENT_COLORS: ReadonlyArray<{ id: string; hex: string }> = [
  { id: "1", hex: "#7986cb" }, // Lavender
  { id: "2", hex: "#33b679" }, // Sage
  { id: "3", hex: "#8e24aa" }, // Grape
  { id: "4", hex: "#e67c73" }, // Flamingo
  { id: "5", hex: "#f6bf26" }, // Banana
  { id: "6", hex: "#f4511e" }, // Tangerine
  { id: "7", hex: "#039be5" }, // Peacock
  { id: "8", hex: "#616161" }, // Graphite
  { id: "9", hex: "#3f51b5" }, // Blueberry
  { id: "10", hex: "#0b8043" }, // Basil
  { id: "11", hex: "#d50000" }, // Tomato
];

/**
 * Fallback when the input is not a parseable hex color: neutral Graphite. A
 * category always carries a valid hex in practice, so this only guards against
 * malformed data rather than expressing a real color choice.
 */
export const DEFAULT_COLOR_ID = "8";

function parseHex(hex: string): [number, number, number] | null {
  if (typeof hex !== "string") return null;
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

export function nearestGoogleColorId(hex: string): string {
  const target = parseHex(hex);
  if (!target) return DEFAULT_COLOR_ID;

  let bestId = DEFAULT_COLOR_ID;
  let bestDistance = Infinity;
  for (const color of GOOGLE_EVENT_COLORS) {
    const rgb = parseHex(color.hex)!;
    const distance =
      (rgb[0] - target[0]) ** 2 +
      (rgb[1] - target[1]) ** 2 +
      (rgb[2] - target[2]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = color.id;
    }
  }
  return bestId;
}
