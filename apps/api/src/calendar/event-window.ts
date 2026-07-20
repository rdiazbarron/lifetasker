/**
 * Pure computation of a completed activity's calendar time window.
 *
 * A completion records only *when it finished* (`completedAt`) and how long the
 * block takes (`durationMinutes`). The calendar event is therefore anchored at
 * the end and extended backwards:
 *
 *   end   = completedAt
 *   start = completedAt − durationMinutes
 *
 * This holds for a backdated completion too — the window simply lands in the
 * past. Kept free of any Google or Prisma types so it is trivially unit-tested
 * (see event-window.spec.ts) and reused verbatim by #36's retry path.
 */
export interface EventWindow {
  start: Date;
  end: Date;
}

const MS_PER_MINUTE = 60_000;

export function computeEventWindow(
  completedAt: Date,
  durationMinutes: number,
): EventWindow {
  // Guard junk durations (0, negative, NaN) into a zero-length window rather
  // than letting them produce an event that starts after it ends.
  const minutes =
    Number.isFinite(durationMinutes) && durationMinutes > 0
      ? durationMinutes
      : 0;
  const end = new Date(completedAt.getTime());
  const start = new Date(end.getTime() - minutes * MS_PER_MINUTE);
  return { start, end };
}
