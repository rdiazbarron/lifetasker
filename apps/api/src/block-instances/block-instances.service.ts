import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "../common/demo-user";
import { getWeekBounds } from "../common/week";
import { CompleteBlockDto } from "./dto/complete-block.dto";
import { WeeklyPlansService } from "../weekly-plans/weekly-plans.service";

@Injectable()
export class BlockInstancesService {
  constructor(
    private prisma: PrismaService,
    private weeklyPlansService: WeeklyPlansService,
  ) {}
  private async userId() {
    return (
      await this.prisma.user.upsert({
        where: { email: DEMO_USER_EMAIL },
        update: {},
        create: { email: DEMO_USER_EMAIL, name: DEMO_USER_NAME },
      })
    ).id;
  }
  async complete(dto: CompleteBlockDto) {
    await this.weeklyPlansService.getCurrent();
    const userId = await this.userId();
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
  async currentWeek() {
    const userId = await this.userId();
    const { weekStart, weekEnd } = getWeekBounds(new Date());
    return this.prisma.blockInstance.findMany({
      where: { userId, completedAt: { gte: weekStart, lte: weekEnd } },
      include: { blockType: { include: { category: true } } },
      orderBy: { completedAt: "desc" },
    });
  }
}
