import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { WeekService } from "../common/week.service";
import { LevelCalculator } from "./level-calculator";
import { LifetimeLevelCalculator } from "./lifetime-level-calculator";

type PlanItem = Prisma.WeeklyPlanItemGetPayload<{
  include: { blockType: { include: { category: true } } };
}>;
type Completion = Prisma.BlockInstanceGetPayload<{
  include: { blockType: { include: { category: true } } };
}>;

type WeekRow = {
  weekStart: string;
  weekEnd: string;
  counts: Record<string, number>;
};

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

    // Lifetime points are the sum of every completion's frozen points, all-time.
    const lifetimeAgg = await this.prisma.blockInstance.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const planItems = plan?.planItems ?? [];
    const totalTarget = planItems.reduce((sum, i) => sum + i.targetCount, 0);
    const totalCompleted = completed.length;
    // Points earned this week: the sum of each completion's frozen points.
    const pointsThisWeek = completed.reduce((sum, c) => sum + c.points, 0);

    return {
      totalTargetBlocks: totalTarget,
      totalCompletedBlocks: totalCompleted,
      pointsThisWeek,
      progressPercentage:
        totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0,
      progressByBlockType: this.aggregateByBlockType(planItems, completed),
      progressByCategory: this.aggregateByCategory(planItems, completed),
      weeklyLevel: LevelCalculator.compute(totalCompleted),
      lifetime: LifetimeLevelCalculator.compute(lifetimeAgg._sum.points ?? 0),
    };
  }

  /**
   * The whole history as a week × category grid: one row per week from the
   * week of the user's first completion through the current week (newest
   * first), each carrying per-category completion counts, zero-filled so
   * inactive categories and empty weeks are visible.
   */
  async overview() {
    const userId = await this.userContext.userId();

    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    });

    const completions = await this.prisma.blockInstance.findMany({
      where: { userId },
      orderBy: { completedAt: "asc" },
      select: { completedAt: true, blockType: { select: { categoryId: true } } },
    });

    if (completions.length === 0) {
      return { categories, weeks: [] as WeekRow[] };
    }

    // Tally counts keyed by (weekStart ISO, categoryId).
    const counts = new Map<string, Map<string, number>>();
    for (const c of completions) {
      const key = this.week.boundsFor(c.completedAt).weekStart.toISOString();
      const perCategory = counts.get(key) ?? new Map<string, number>();
      const categoryId = c.blockType.categoryId;
      perCategory.set(categoryId, (perCategory.get(categoryId) ?? 0) + 1);
      counts.set(key, perCategory);
    }

    const firstStart = this.week.boundsFor(completions[0].completedAt).weekStart;
    const currentStart = this.week.currentBounds().weekStart;

    // Emit every week from first to current so gaps show as rows of zeros.
    const weeks: WeekRow[] = [];
    const cursor = new Date(firstStart);
    while (cursor.getTime() <= currentStart.getTime()) {
      const { weekStart, weekEnd } = this.week.boundsFor(cursor);
      const perCategory = counts.get(weekStart.toISOString());
      const row: Record<string, number> = {};
      for (const category of categories) {
        row[category.id] = perCategory?.get(category.id) ?? 0;
      }
      weeks.push({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        counts: row,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }

    weeks.reverse(); // newest first
    return { categories, weeks };
  }

  /**
   * Per-day completion counts over the trailing ~12 months, keyed on the day a
   * block was completed. Optionally filtered to a single category ("all" or
   * omitted means every category). Only non-zero days are returned; the client
   * fills the rest of the calendar with zeros.
   */
  async heatmap(categoryId?: string) {
    const userId = await this.userContext.userId();

    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    start.setUTCDate(start.getUTCDate() - 364); // 53 weeks of history

    const where: Prisma.BlockInstanceWhereInput = {
      userId,
      completedAt: { gte: start },
    };
    if (categoryId && categoryId !== "all") {
      where.blockType = { categoryId };
    }

    const completions = await this.prisma.blockInstance.findMany({
      where,
      select: { completedAt: true },
    });

    const counts = new Map<string, number>();
    for (const c of completions) {
      const day = c.completedAt.toISOString().slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }

    const days = Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
      days,
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
