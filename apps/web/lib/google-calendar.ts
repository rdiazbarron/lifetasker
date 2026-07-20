/**
 * Shared constants for the Google Calendar integration.
 *
 * This module is deliberately free of any server-only imports (no `pg`, no the
 * Better Auth server instance) so BOTH the server auth config (`lib/auth.ts`)
 * and client components (the settings page, the auth form) can import it and
 * agree on the same provider id and scopes.
 *
 * #34 delivers the connection only; the actual calendar writes land in #35,
 * which reuses `GOOGLE_CALENDAR_SCOPES` so the access requested at connect time
 * is exactly what the sync code needs.
 */

/** Better Auth provider id for Google (the `providerId` stored on `Account`). */
export const GOOGLE_PROVIDER_ID = "google";

/**
 * Scopes requested when a user connects Google. Beyond the default
 * openid/email/profile Better Auth always asks for, we request full Calendar
 * access so #35 can create the dedicated "LifeTasker" calendar and write
 * completed-activity events to it.
 *
 * Calendar is a Google "sensitive" scope, so the OAuth client runs in testing
 * mode with allowlisted users; public verification is out of scope for #34.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

/**
 * Whether the Google connection UI should be shown. Set
 * `NEXT_PUBLIC_GOOGLE_ENABLED=true` once the OAuth client credentials are in
 * place; left unset, the app hides the Google affordances and runs on
 * email/password exactly as before.
 */
export const GOOGLE_UI_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";

/**
 * True once a connected Google account has actually granted Calendar access.
 * `listAccounts()` returns the granted scopes, so the UI can tell a plain
 * "signed in with Google" account apart from one cleared for calendar sync.
 */
export function hasCalendarScope(
  scopes: string[] | undefined | null,
): boolean {
  if (!scopes) return false;
  return GOOGLE_CALENDAR_SCOPES.every((required) => scopes.includes(required));
}
