import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { WeekService } from "../common/week.service";
import { LevelCalculator } from "./level-calculator";

type PlanItem = Prisma.WeeklyPlanItemGetPayload<{
  include: { blockType: { include: { category: true } } };
}>;
type Completion = Prisma.BlockInstanceGetPayload<{
  include: { blockType: { include: { category: true } } };
}>;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
    private readonly week: WeekService,
  ) {}

  async currentWeek() {
    const userId = await this.userContext.userId();
    const { weekStart, weekEnd } = this.week.currentBounds();

    const plan = await this.prisma.weeklyPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: {
        planItems: { include: { blockType: { include: { category: true } } } },
      },
    });
    const completed = await this.prisma.blockInstance.findMany({
      where: { userId, completedAt: { gte: weekStart, lte: weekEnd } },
      include: { blockType: { include: { category: true } } },
    });

    const planItems = plan?.planItems ?? [];
    const totalTarget = planItems.reduce((sum, i) => sum + i.targetCount, 0);
    const totalCompleted = completed.length;

    return {
      totalTargetBlocks: totalTarget,
      totalCompletedBlocks: totalCompleted,
      progressPercentage:
        totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0,
      progressByBlockType: this.aggregateByBlockType(planItems, completed),
      progressByCategory: this.aggregateByCategory(planItems, completed),
      weeklyLevel: LevelCalculator.compute(totalCompleted),
    };
  }

  private aggregateByBlockType(planItems: PlanItem[], completed: Completion[]) {
    return planItems.map((item) => ({
      blockTypeId: item.blockTypeId,
      blockTypeName: item.blockType.name,
      target: item.targetCount,
      completed: completed.filter((c) => c.blockTypeId === item.blockTypeId)
        .length,
    }));
  }

  private aggregateByCategory(planItems: PlanItem[], completed: Completion[]) {
    const byCategory = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        target: number;
        completed: number;
      }
    >();

    for (const item of planItems) {
      const categoryId = item.blockType.categoryId;
      const entry = byCategory.get(categoryId) ?? {
        categoryId,
        categoryName: item.blockType.category.name,
        target: 0,
        completed: 0,
      };
      entry.target += item.targetCount;
      byCategory.set(categoryId, entry);
    }

    // Count completions once per category. The previous inline reduce ran this
    // filter once per plan item, double-counting categories with >1 block type.
    for (const entry of byCategory.values()) {
      entry.completed = completed.filter(
        (c) => c.blockType.categoryId === entry.categoryId,
      ).length;
    }

    return Array.from(byCategory.values());
  }
}
