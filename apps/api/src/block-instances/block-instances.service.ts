import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { WeekService } from "../common/week.service";
import { CompleteBlockDto } from "./dto/complete-block.dto";
import { PlanBootstrapper } from "../weekly-plans/plan-bootstrapper.service";
import { PointsCalculator } from "../progress/points-calculator";

@Injectable()
export class BlockInstancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
    private readonly week: WeekService,
    private readonly planBootstrapper: PlanBootstrapper,
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

    return this.prisma.blockInstance.create({
      data: {
        userId,
        blockTypeId: dto.blockTypeId,
        points,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        notes: dto.notes,
      },
    });
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
