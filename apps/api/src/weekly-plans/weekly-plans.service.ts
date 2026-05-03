import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "../common/demo-user";
import { getWeekBounds } from "../common/week";
import {
  CreateWeeklyPlanDto,
  UpdateWeeklyPlanItemsDto,
} from "./dto/create-weekly-plan.dto";

@Injectable()
export class WeeklyPlansService {
  constructor(private prisma: PrismaService) {}

  private async userId() {
    return (
      await this.prisma.user.upsert({
        where: { email: DEMO_USER_EMAIL },
        update: {},
        create: { email: DEMO_USER_EMAIL, name: DEMO_USER_NAME },
      })
    ).id;
  }

  async create(dto: CreateWeeklyPlanDto) {
    const userId = await this.userId();
    const { weekStart, weekEnd } = getWeekBounds(new Date(dto.weekStartDate));
    const existing = await this.prisma.weeklyPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
    if (existing)
      throw new BadRequestException("Weekly plan already exists for this week");

    return this.prisma.weeklyPlan.create({
      data: { userId, weekStart, weekEnd, planItems: { create: dto.items } },
      include: { planItems: true },
    });
  }

  async getCurrent() {
    const userId = await this.userId();
    const now = getWeekBounds(new Date());

    const existingPlan = await this.prisma.weeklyPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart: now.weekStart } },
      include: { planItems: true },
    });
    if (existingPlan) return existingPlan;

    const previousPlan = await this.prisma.weeklyPlan.findFirst({
      where: { userId, weekStart: { lt: now.weekStart } },
      include: { planItems: true },
      orderBy: { weekStart: "desc" },
    });

    return this.prisma.weeklyPlan.create({
      data: {
        userId,
        weekStart: now.weekStart,
        weekEnd: now.weekEnd,
        planItems: {
          create:
            previousPlan?.planItems.map((item) => ({
              blockTypeId: item.blockTypeId,
              targetCount: item.targetCount,
            })) ?? [],
        },
      },
      include: { planItems: true },
    });
  }

  async findOne(id: string) {
    const userId = await this.userId();
    const p = await this.prisma.weeklyPlan.findFirst({
      where: { id, userId },
      include: { planItems: true },
    });
    if (!p) throw new NotFoundException("Weekly plan not found");
    return p;
  }

  async updateItems(id: string, dto: UpdateWeeklyPlanItemsDto) {
    const p = await this.findOne(id);
    await this.prisma.weeklyPlanItem.deleteMany({
      where: { weeklyPlanId: p.id },
    });
    return this.prisma.weeklyPlan.update({
      where: { id },
      data: { planItems: { create: dto.items } },
      include: { planItems: true },
    });
  }
}
