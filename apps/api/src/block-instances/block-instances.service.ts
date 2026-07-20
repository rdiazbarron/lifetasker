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

@Injectable()
export class BlockInstancesService {
  private readonly logger = new Logger(BlockInstancesService.name);

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
      // without the Google round-trip. `pushToCalendar` never rejects.
      void this.pushToCalendar(userId, instance, blockType);
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
   * Background, best-effort push of a completed block to Google Calendar. Runs
   * after the completion response has already been sent, so it never blocks the
   * user. Never rejects: on success it flips the row to SYNCED with the event
   * id; on failure the row keeps its PENDING status for #36's retry.
   */
  private async pushToCalendar(
    userId: string,
    instance: BlockInstance,
    blockType: BlockType & { category: Category },
  ): Promise<void> {
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
    } catch (error) {
      // Row stays PENDING (its creation value); #36's retry will pick it up.
      this.logger.warn(
        `Calendar sync failed for completion ${instance.id}: ${String(error)}`,
      );
    }
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

    return this.prisma.blockInstance.delete({ where: { id: latest.id } });
  }

  async currentWeek() {
    const userId = await this.userContext.userId();
    const { weekStart, weekEnd } = this.week.currentBounds();
    return this.prisma.blockInstance.findMany({
      where: { userId, completedAt: { gte: weekStart, lte: weekEnd } },
      include: { blockType: { include: { category: true } } },
      orderBy: { completedAt: "desc" },
    });
  }
}
