import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserContextService } from "../common/user-context.service";
import { WeekService } from "../common/week.service";
import { PlanBootstrapper } from "./plan-bootstrapper.service";
import {
  CreateWeeklyPlanDto,
  UpdateWeeklyPlanItemsDto,
} from "./dto/create-weekly-plan.dto";

@Injectable()
export class WeeklyPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
    private readonly week: WeekService,
    private readonly planBootstrapper: PlanBootstrapper,
  ) {}

  async create(dto: CreateWeeklyPlanDto) {
    const userId = await this.userContext.userId();
    const { weekStart, weekEnd } = this.week.boundsFor(
      new Date(dto.weekStartDate),
    );
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
    const userId = await this.userContext.userId();
    return this.planBootstrapper.ensureCurrentPlan(userId);
  }

  async findOne(id: string) {
    const userId = await this.userContext.userId();
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
