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

    // The completion is persisted first and always succeeds; the calendar sync
    // is a best-effort follow-on that can only annotate the row afterwards.
    const instance = await this.prisma.blockInstance.create({
      data: {
        userId,
        blockTypeId: dto.blockTypeId,
        points,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        notes: dto.notes,
      },
    });

    return this.syncToCalendar(userId, instance, blockType);
  }

  /**
   * One-way, best-effort push of a completion to Google Calendar. Never throws:
   * an unconnected user leaves the row NOT_APPLICABLE (no calls made), a
   * successful write marks it SYNCED with the event id, and any failure leaves
   * it PENDING for #36's retry to pick up. Points and history are already
   * committed by the time this runs, so they are never at risk.
   */
  private async syncToCalendar(
    userId: string,
    instance: BlockInstance,
    blockType: BlockType & { category: Category },
  ): Promise<BlockInstance> {
    let connected = false;
    try {
      connected = await this.calendar.isConnected(userId);
    } catch (error) {
      this.logger.warn(`Calendar connection check failed: ${String(error)}`);
    }
    if (!connected) return instance; // NOT_APPLICABLE — nothing to do

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
      return this.prisma.blockInstance.update({
        where: { id: instance.id },
        data: { calendarSyncStatus: "SYNCED", googleEventId },
      });
    } catch (error) {
      this.logger.warn(
        `Calendar sync failed for completion ${instance.id}: ${String(error)}`,
      );
      return this.prisma.blockInstance.update({
        where: { id: instance.id },
        data: { calendarSyncStatus: "PENDING" },
      });
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
