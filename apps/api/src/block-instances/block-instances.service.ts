import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { WeekService } from "../common/week.service";
import { CompleteBlockDto } from "./dto/complete-block.dto";
import { PlanBootstrapper } from "../weekly-plans/plan-bootstrapper.service";

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
    await this.planBootstrapper.ensureCurrentPlan(userId);
    return this.prisma.blockInstance.create({
      data: {
        userId,
        blockTypeId: dto.blockTypeId,
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
