import { Injectable } from "@nestjs/common";

export interface WeekBounds {
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Owns the definition of a "week" (Monday 00:00 UTC → Sunday 23:59:59.999 UTC).
 * Consumers depend on this seam rather than on the raw date arithmetic, so
 * locale rules, caching, or a test clock can change in exactly one place.
 */
@Injectable()
export class WeekService {
  currentBounds(): WeekBounds {
    return this.boundsFor(new Date());
  }

  boundsFor(date: Date): WeekBounds {
    const utcDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const day = utcDate.getUTCDay();
    const diffToMonday = (day + 6) % 7;

    const weekStart = new Date(utcDate);
    weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }
}
