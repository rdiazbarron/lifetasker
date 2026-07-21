/**
 * The single boundary between LifeTasker and Google Calendar (#33/#35).
 *
 * Everything the app knows about "syncing a completion" is expressed through
 * this small port: is the user connected, create an event, delete an event.
 * All Google specifics — OAuth token refresh, ensuring the dedicated
 * "LifeTasker" calendar exists, the hex→palette color mapping, timezones — live
 * behind the real implementation (GoogleCalendarService). Tests substitute a
 * fake so no scenario ever touches the network.
 *
 * The abstract class doubles as the DI injection token (see calendar.module.ts).
 */
export interface CalendarEventInput {
  /**
   * Caller-supplied, deterministic event id derived from the completion id
   * (#47). Passing it makes `createEvent` a create-or-get: a retry after a
   * create-ok/persist-fail crash inserts the same id and no duplicate event is
   * made. See calendar/event-id.ts.
   */
  eventId: string;
  /** Event title — the block type's name. */
  summary: string;
  /** Human-readable body — category, points earned, and any notes. */
  description: string;
  /** Window start (`completedAt − durationMinutes`). */
  start: Date;
  /** Window end (`completedAt`). */
  end: Date;
  /** Category hex color; the implementation maps it to a Google `colorId`. */
  colorHex: string;
}

export abstract class CalendarPort {
  /**
   * Whether this user has a Google account cleared for calendar writes (linked,
   * with a refresh token and the calendar scope granted). Callers use this to
   * distinguish "no-op, not connected" (NOT_APPLICABLE) from an attempted sync.
   */
  abstract isConnected(userId: string): Promise<boolean>;

  /**
   * Creates the event in the user's dedicated "LifeTasker" calendar (ensuring
   * that calendar exists first) and returns the created event id. Throws on any
   * failure — the caller decides how to record that (PENDING), never the port.
   */
  abstract createEvent(
    userId: string,
    input: CalendarEventInput,
  ): Promise<string>;

  /**
   * Deletes a previously created event. Used by undo (#36); a missing event is
   * treated as already gone, not an error.
   */
  abstract deleteEvent(userId: string, eventId: string): Promise<void>;
}
