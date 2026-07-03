import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WeekService } from "../common/week.service";

/**
 * Guarantees the user has a plan for the current week, creating one (seeded
 * from the previous week's targets) when it is missing.
 *
 * Extracted so the "ensure a plan exists" intent is explicit at every call
 * site — previously BlockInstancesService relied on the side effect of calling
 * WeeklyPlansService.getCurrent() and discarding its return value.
 */
@Injectable()
export class PlanBootstrapper {
  constructor(
    private readonly prisma: PrismaService,
    private readonly week: WeekService,
  ) {}

  async ensureCurrentPlan(userId: string) {
    const { weekStart, weekEnd } = this.week.currentBounds();

    const existing = await this.prisma.weeklyPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: { planItems: true },
    });
    if (existing) return existing;

    const previous = await this.prisma.weeklyPlan.findFirst({
      where: { userId, weekStart: { lt: weekStart } },
      include: { planItems: true },
      orderBy: { weekStart: "desc" },
    });

    return this.prisma.weeklyPlan.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        planItems: {
          create:
            previous?.planItems.map((item) => ({
              blockTypeId: item.blockTypeId,
              targetCount: item.targetCount,
            })) ?? [],
        },
      },
      include: { planItems: true },
    });
  }
}
