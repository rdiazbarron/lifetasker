import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { BlockInstance, BlockType, Category } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { WeekService } from "../common/week.service";
import { CompleteBlockDto } from "./dto/complete-block.dto";
import { PlanBootstrapper } from "../weekly-plans/plan-bootstrapper.service";
import { PointsCalculator } from "../progress/points-calculator";
import { CalendarPort } from "../calendar/calendar.port";
import { computeEventWindow } from "../calendar/event-window";
import { calendarEventId } from "../calendar/event-id";

export interface SyncSummary {
  /** Rows that reached the calendar on this pass. */
  synced: number;
  /** Rows still PENDING after this pass (write attempted and failed). */
  pending: number;
}

@Injectable()
export class BlockInstancesService {
  private readonly logger = new Logger(BlockInstancesService.name);

  // Serializes drains per user: a completion, a dashboard load, and a manual
  // "Sync now" can all fire at once. Only one drain runs per user at a time —
  // the guard that keeps retries from duplicating events (alongside the id-based
  // filter). A request that arrives while a drain is running sets `rerun` so one
  // more pass follows: the running drain snapshotted its PENDING rows before the
  // new request's row existed, and this guarantees that row still gets synced.
  private readonly drains = new Map<string, Promise<SyncSummary>>();
  private readonly rerun = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
    private readonly week: WeekService,
    private readonly planBootstrapper: PlanBootstrapper,
    private readonly calendar: CalendarPort,
  ) {}

  async complete(dto: CompleteBlockDto) {
    const userId = await this.userContext.userId();

    // The block type must belong to the caller; this also gives us the duration
    // and the category weight to score the completion.
    const blockType = await this.prisma.blockType.findFirst({
      // archivedAt: null — a soft-deleted block type can't accept new
      // completions (it's hidden from the UI, but block the API path too).
      where: { id: dto.blockTypeId, userId, archivedAt: null },
      include: { category: true },
    });
    if (!blockType) {
      throw new NotFoundException("Block type not found");
    }

    await this.planBootstrapper.ensureCurrentPlan(userId);

    // Score the completion now and freeze it: later category-weight edits must
    // not change points already earned. See progress/points-calculator.ts.
    const points = PointsCalculator.compute(
      blockType.durationMinutes,
      blockType.category.weightPercent,
    );

    // Whether the user is calendar-connected is a fast, local DB check (no
    // network), so it is safe to resolve before responding.
    const connected = await this.isConnectedSafely(userId);

    // Persist the completion and return IMMEDIATELY. Marking a block done must
    // be instant and must never wait on — or fail because of — Google (the #33
    // hybrid model). A connected user's row starts PENDING; the actual calendar
    // write runs in the background (below) and flips it to SYNCED, or leaves it
    // PENDING for #36's retry. Points and history are committed here, up front,
    // so they never depend on Google being reachable.
    const instance = await this.prisma.blockInstance.create({
      data: {
        userId,
        blockTypeId: dto.blockTypeId,
        points,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        notes: dto.notes,
        calendarSyncStatus: connected ? "PENDING" : "NOT_APPLICABLE",
      },
    });

    if (connected) {
      // Fire-and-forget: deliberately NOT awaited so the HTTP response returns
      // without the Google round-trip. Draining here (rather than pushing just
      // this row) also sweeps up any earlier PENDING rows — the "retry on next
      // completion" half of #36. `syncPending` never rejects.
      void this.syncPending(userId);
    }

    return instance;
  }

  private async isConnectedSafely(userId: string): Promise<boolean> {
    try {
      return await this.calendar.isConnected(userId);
    } catch (error) {
      this.logger.warn(`Calendar connection check failed: ${String(error)}`);
      return false;
    }
  }

  /**
   * Re-syncs every PENDING completion the user has waiting, and returns a
   * summary. This is the single sync path — used by completion, dashboard load,
   * and the manual "Sync now" action alike.
   *
   * Idempotent by construction: only rows that are still PENDING *and* carry no
   * event id are (re)synced, so an already-synced completion is never
   * duplicated. Calls for the same user are serialized (see `drains`/`rerun`) so
   * two passes can never race on the same row, yet a row created while a drain
   * is running is still guaranteed a pass. Never rejects.
   */
  async syncPending(userId: string): Promise<SyncSummary> {
    const inflight = this.drains.get(userId);
    if (inflight) {
      // A drain is already running; its row snapshot predates this call, so
      // ask it to run once more after it settles. Callers share its result.
      this.rerun.add(userId);
      return inflight;
    }
    return this.runDrain(userId);
  }

  private runDrain(userId: string): Promise<SyncSummary> {
    const drain = this.drainPending(userId)
      .then(async (summary) => {
        if (!this.rerun.delete(userId)) return summary;
        // Fold in a follow-up pass for rows that arrived mid-drain.
        const again = await this.drainPending(userId);
        return {
          synced: summary.synced + again.synced,
          pending: again.pending,
        };
      })
      .finally(() => this.drains.delete(userId));
    this.drains.set(userId, drain);
    return drain;
  }

  private async drainPending(userId: string): Promise<SyncSummary> {
    // Cheap local check; also guards against wasted work if a user disconnected
    // Google while rows were still PENDING.
    if (!(await this.isConnectedSafely(userId))) {
      return { synced: 0, pending: 0 };
    }

    const rows = await this.prisma.blockInstance.findMany({
      where: {
        userId,
        calendarSyncStatus: "PENDING",
        googleEventId: null,
      },
      include: { blockType: { include: { category: true } } },
      orderBy: { completedAt: "asc" },
    });

    let synced = 0;
    let pending = 0;
    for (const row of rows) {
      if (await this.pushOne(userId, row, row.blockType)) synced += 1;
      else pending += 1;
    }
    return { synced, pending };
  }

  /**
   * Best-effort push of a single completion to Google Calendar. On success it
   * flips the row to SYNCED with the event id (returning true); on failure the
   * row keeps its PENDING status for a later retry (returning false). Never
   * rejects.
   */
  private async pushOne(
    userId: string,
    instance: BlockInstance,
    blockType: BlockType & { category: Category },
  ): Promise<boolean> {
    const window = computeEventWindow(
      instance.completedAt,
      blockType.durationMinutes,
    );
    const descriptionLines = [
      `Category: ${blockType.category.name}`,
      `Points: ${instance.points}`,
    ];
    if (instance.notes) descriptionLines.push("", instance.notes);

    try {
      const googleEventId = await this.calendar.createEvent(userId, {
        // Deterministic id keyed on the completion (#47) makes the create
        // idempotent, so the retry below is safe even in the gap this closes.
        eventId: calendarEventId(instance.id),
        summary: blockType.name,
        description: descriptionLines.join("\n"),
        start: window.start,
        end: window.end,
        colorHex: blockType.category.color,
      });
      // Persisting the id right after creating the event closes the dedupe loop:
      // once SYNCED, the row is filtered out of every future drain. If we fail
      // *between* create and this update (a DB error whose write didn't commit,
      // or a crash) the row stays PENDING with no id — but the retry is now
      // harmless: it re-inserts the SAME deterministic event id, which the port
      // resolves as create-or-get (#47) rather than a duplicate. We still do NOT
      // compensate by deleting here: an update that threw *after* committing
      // would then lose a real event.
      await this.prisma.blockInstance.update({
        where: { id: instance.id },
        data: { calendarSyncStatus: "SYNCED", googleEventId },
      });
      return true;
    } catch (error) {
      // Row stays PENDING (its creation value); the next retry will pick it up.
      this.logger.warn(
        `Calendar sync failed for completion ${instance.id}: ${String(error)}`,
      );
      return false;
    }
  }

  /** Manual "Sync now": drain the caller's PENDING completions on demand. */
  async syncNow(): Promise<SyncSummary> {
    const userId = await this.userContext.userId();
    return this.syncPending(userId);
  }

  async undoLast(blockTypeId: string) {
    const userId = await this.userContext.userId();
    const { weekStart, weekEnd } = this.week.currentBounds();

    const latest = await this.prisma.blockInstance.findFirst({
      where: {
        userId,
        blockTypeId,
        completedAt: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { completedAt: "desc" },
    });

    if (!latest) {
      throw new NotFoundException(
        "No completion found this week for this block type.",
      );
    }

    // If this completion reached the calendar, remove its event too — but
    // best-effort: a failed remote delete must not block the local undo (the
    // completion, its points, and history are the source of truth).
    if (latest.googleEventId) {
      try {
        await this.calendar.deleteEvent(userId, latest.googleEventId);
      } catch (error) {
        this.logger.warn(
          `Calendar event delete failed on undo for ${latest.id}: ${String(error)}`,
        );
      }
    }

    return this.prisma.blockInstance.delete({ where: { id: latest.id } });
  }

  async currentWeek() {
    const userId = await this.userContext.userId();
    const { weekStart, weekEnd } = this.week.currentBounds();

    // Retry any PENDING completions in the background on every dashboard load —
    // the "retry on dashboard load" half of #36. Fire-and-forget so the list
    // returns without waiting on Google; the freshly synced statuses show up on
    // the next poll.
    void this.syncPending(userId);

    return this.prisma.blockInstance.findMany({
      where: { userId, completedAt: { gte: weekStart, lte: weekEnd } },
      include: { blockType: { include: { category: true } } },
      orderBy: { completedAt: "desc" },
    });
  }
}
