import { Injectable, Logger } from "@nestjs/common";
import { calendar_v3, google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { Account } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CalendarEventInput, CalendarPort } from "./calendar.port";
import { nearestGoogleColorId } from "./google-color";

/** Better Auth stores Google under this provider id. */
const GOOGLE_PROVIDER_ID = "google";
/** The scope a connected account must have granted to allow calendar writes. */
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
/** Name of the dedicated calendar every connected user gets, created once. */
const CALENDAR_NAME = "LifeTasker";

/**
 * The real Google Calendar boundary. Reads the OAuth tokens Better Auth stored
 * on the shared `Account` row (plaintext, per its default config), refreshes
 * them via the shared OAuth client, ensures the dedicated "LifeTasker" calendar
 * exists, and writes/deletes events.
 *
 * The credentials come from the SAME Google OAuth client the web app connects
 * with (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). With them unset the API
 * simply reports every user as not-connected, so completions run exactly as
 * before — mirroring how the web app hides the Google UI when unconfigured.
 */
@Injectable()
export class GoogleCalendarService extends CalendarPort {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isConnected(userId: string): Promise<boolean> {
    return (await this.calendarAccount(userId)) !== null;
  }

  async createEvent(
    userId: string,
    input: CalendarEventInput,
  ): Promise<string> {
    const account = await this.calendarAccount(userId);
    if (!account) {
      // Callers gate on isConnected(); reaching here means the connection was
      // revoked between the check and the write. Treat as a sync failure.
      throw new Error("No calendar-connected Google account for user.");
    }

    const auth = this.authClient(account);
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = await this.ensureCalendar(calendar, account);

    const event: calendar_v3.Schema$Event = {
      // Caller-supplied deterministic id (#47) makes the insert idempotent: a
      // retry after a create-ok/persist-fail crash reuses this id and Google
      // rejects the duplicate (409) instead of making a second event.
      id: input.eventId,
      summary: input.summary,
      description: input.description,
      // UTC dateTimes pin the event to the exact instant it happened; the
      // user's calendar renders it in their own timezone.
      start: { dateTime: input.start.toISOString(), timeZone: "UTC" },
      end: { dateTime: input.end.toISOString(), timeZone: "UTC" },
      colorId: nearestGoogleColorId(input.colorHex),
    };

    try {
      const created = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });
      const eventId = created.data.id;
      if (!eventId) {
        throw new Error("Google Calendar returned no event id.");
      }
      return eventId;
    } catch (error) {
      // The event already exists under our deterministic id — a previous
      // attempt created it but we never persisted the id. Treat create-or-get
      // as success and return the id we asked for.
      if (this.isDuplicate(error)) return input.eventId;
      throw error;
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const account = await this.calendarAccount(userId);
    if (!account?.calendarId) return; // nothing to delete against

    const auth = this.authClient(account);
    const calendar = google.calendar({ version: "v3", auth });

    try {
      await calendar.events.delete({
        calendarId: account.calendarId,
        eventId,
      });
    } catch (error) {
      // Already gone (deleted in Google, or never fully created) is success.
      if (this.isNotFound(error)) return;
      throw error;
    }
  }

  /**
   * The user's Google `Account`, but only if it is actually usable for calendar
   * writes: credentials configured, a refresh token present, and the calendar
   * scope granted. Returns null otherwise — the signal for NOT_APPLICABLE.
   */
  private async calendarAccount(userId: string): Promise<Account | null> {
    if (!this.clientId || !this.clientSecret) return null;

    const account = await this.prisma.account.findFirst({
      where: { userId, providerId: GOOGLE_PROVIDER_ID },
    });
    if (!account?.refreshToken) return null;
    if (!this.hasCalendarScope(account.scope)) return null;
    return account;
  }

  private hasCalendarScope(scope: string | null): boolean {
    if (!scope) return false;
    // Better Auth joins granted scopes with spaces; tolerate commas too.
    const granted = scope.split(/[\s,]+/).filter(Boolean);
    return granted.includes(CALENDAR_SCOPE);
  }

  /**
   * Builds an OAuth client seeded with the stored tokens. google-auth-library
   * refreshes the access token on demand from the refresh token; we listen for
   * the refreshed token and persist it so the row stays current and Better Auth
   * keeps working.
   */
  private authClient(account: Account): OAuth2Client {
    const client = new google.auth.OAuth2(this.clientId, this.clientSecret);
    client.setCredentials({
      access_token: account.accessToken ?? undefined,
      refresh_token: account.refreshToken ?? undefined,
      expiry_date: account.accessTokenExpiresAt?.getTime(),
    });

    client.on("tokens", (tokens) => {
      // Best-effort persistence; a failed write only means a redundant refresh
      // next time, never a broken sync.
      this.prisma.account
        .update({
          where: { id: account.id },
          data: {
            ...(tokens.access_token
              ? { accessToken: tokens.access_token }
              : {}),
            ...(tokens.refresh_token
              ? { refreshToken: tokens.refresh_token }
              : {}),
            ...(tokens.expiry_date
              ? { accessTokenExpiresAt: new Date(tokens.expiry_date) }
              : {}),
          },
        })
        .catch((error) =>
          this.logger.warn(
            `Failed to persist refreshed Google token: ${String(error)}`,
          ),
        );
    });

    return client;
  }

  /**
   * Returns the id of this account's dedicated "LifeTasker" calendar, creating
   * it once and caching the id on the account for every later completion.
   */
  private async ensureCalendar(
    calendar: calendar_v3.Calendar,
    account: Account,
  ): Promise<string> {
    if (account.calendarId) return account.calendarId;

    const created = await calendar.calendars.insert({
      requestBody: { summary: CALENDAR_NAME },
    });
    const calendarId = created.data.id;
    if (!calendarId) {
      throw new Error("Google Calendar returned no calendar id.");
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: { calendarId },
    });
    // Keep the in-memory copy consistent for the rest of this request.
    account.calendarId = calendarId;
    return calendarId;
  }

  private isNotFound(error: unknown): boolean {
    const code = (error as { code?: number | string })?.code;
    return code === 404 || code === 410 || code === "404" || code === "410";
  }

  /** A 409 from `events.insert` means our deterministic id is already taken. */
  private isDuplicate(error: unknown): boolean {
    const code = (error as { code?: number | string })?.code;
    return code === 409 || code === "409";
  }

  private get clientId(): string | undefined {
    return process.env.GOOGLE_CLIENT_ID || undefined;
  }

  private get clientSecret(): string | undefined {
    return process.env.GOOGLE_CLIENT_SECRET || undefined;
  }
}
