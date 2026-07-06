import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { LifetimeLevelCalculator } from "../progress/lifetime-level-calculator";
import { evaluateEmblems, longestStreak } from "./emblem-catalog";

@Injectable()
export class EmblemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  /**
   * Evaluate the whole emblem catalog for the current user from their stored
   * history. Earned status is derived, not event-driven, so it is retroactive:
   * a user who already qualifies has the emblem immediately.
   */
  async list() {
    const userId = await this.userContext.userId();

    const categories = await this.prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const completions = await this.prisma.blockInstance.findMany({
      where: { userId },
      select: {
        completedAt: true,
        blockTypeId: true,
        points: true,
        blockType: { select: { categoryId: true } },
      },
    });

    const categoryCounts: Record<string, number> = {};
    const activeDays: string[] = [];
    let totalPoints = 0;
    for (const c of completions) {
      const categoryId = c.blockType.categoryId;
      categoryCounts[categoryId] = (categoryCounts[categoryId] ?? 0) + 1;
      activeDays.push(c.completedAt.toISOString().slice(0, 10));
      totalPoints += c.points;
    }

    const lifetimeLevel = LifetimeLevelCalculator.compute(totalPoints).level;
    const perfectWeeks = await this.countPerfectWeeks(userId, completions);

    const emblems = evaluateEmblems({
      categories,
      categoryCounts,
      longestStreakDays: longestStreak(activeDays),
      lifetimeLevel,
      perfectWeeks,
    });

    return {
      emblems,
      earnedCount: emblems.filter((e) => e.earned).length,
      total: emblems.length,
    };
  }

  /**
   * A week is "perfect" when it had a plan with at least one target and every
   * plan item's completions met or exceeded its target within that week.
   */
  private async countPerfectWeeks(
    userId: string,
    completions: Array<{ blockTypeId: string; completedAt: Date }>,
  ): Promise<number> {
    const plans = await this.prisma.weeklyPlan.findMany({
      where: { userId },
      include: { planItems: true },
    });

    let perfect = 0;
    for (const plan of plans) {
      if (plan.planItems.length === 0) continue;
      const allMet = plan.planItems.every((item) => {
        const done = completions.filter(
          (c) =>
            c.blockTypeId === item.blockTypeId &&
            c.completedAt >= plan.weekStart &&
            c.completedAt <= plan.weekEnd,
        ).length;
        return done >= item.targetCount;
      });
      if (allMet) perfect++;
    }
    return perfect;
  }
}
