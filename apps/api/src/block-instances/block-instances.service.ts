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

export interface SyncSummary {
  /** Rows that reached the calendar on this pass. */
  synced: number;
  /** Rows still PENDING after this pass (write attempted and failed). */
  pending: number;
}

@Injectable()
export class BlockInstancesService {
  private readonly logger = new Logger(BlockInstancesService.name);

  // Coalesces overlapping drains per user: a completion, a dashboard load, and a
  // manual "Sync now" can all fire at once. Sharing one in-flight promise means
  // a PENDING row is never picked up by two passes at the same time — the guard
  // that keeps retries from duplicating events (alongside the id-based filter).
  private readonly drains = new Map<string, Promise<SyncSummary>>();

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
      where: { id: dto.blockTypeId, userId },
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
   * duplicated. Overlapping calls for the same user share one in-flight drain
   * (see `drains`) so two passes can never race on the same row. Never rejects.
   */
  async syncPending(userId: string): Promise<SyncSummary> {
    const inflight = this.drains.get(userId);
    if (inflight) return inflight;

    const drain = this.drainPending(userId).finally(() =>
      this.drains.delete(userId),
    );
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
        summary: blockType.name,
        description: descriptionLines.join("\n"),
        start: window.start,
        end: window.end,
        colorHex: blockType.category.color,
      });
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
