import { Module } from "@nestjs/common";
import { CalendarPort } from "./calendar.port";
import { GoogleCalendarService } from "./google-calendar.service";

/**
 * Wires the Google implementation behind the abstract `CalendarPort` token, so
 * every consumer depends only on the port. Swapping the real service for a fake
 * (in tests) is a one-line provider override; nothing else changes.
 */
@Module({
  providers: [{ provide: CalendarPort, useClass: GoogleCalendarService }],
  exports: [CalendarPort],
})
export class CalendarModule {}
