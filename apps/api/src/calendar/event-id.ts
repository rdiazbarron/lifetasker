import { createHash } from "node:crypto";

/**
 * A client-supplied, deterministic Google Calendar event id for a completion
 * (#47). Passing this id on `events.insert` makes the create idempotent: if a
 * previous attempt already created the event but we failed to persist its id
 * (the create-ok/persist-fail window), the retry inserts the *same* id and
 * Google returns 409 instead of making a second event.
 *
 * Google requires event ids to use base32hex characters (lowercase `a-v` and
 * digits `0-9`), length 5–1024. Our completion ids are cuids, whose alphabet
 * (letters up to `z`) is out of range — so we derive the id from a SHA-256
 * digest, whose hex output (`0-9a-f`) is a valid base32hex subset. The digest
 * is a pure function of the completion id, so the same completion always maps
 * to the same event id.
 */
export function calendarEventId(completionId: string): string {
  // `lt` prefix keeps the ids recognizably LifeTasker's and both chars are in
  // range; the 64-char hex digest keeps us comfortably within Google's bounds.
  const digest = createHash("sha256").update(completionId).digest("hex");
  return `lt${digest}`;
}
