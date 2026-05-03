import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { WeeklyPlansService } from "./weekly-plans.service";
import {
  CreateWeeklyPlanDto,
  UpdateWeeklyPlanItemsDto,
} from "./dto/create-weekly-plan.dto";
@Controller("weekly-plans")
export class WeeklyPlansController {
  constructor(private readonly service: WeeklyPlansService) {}
  @Post() create(@Body() dto: CreateWeeklyPlanDto) {
    return this.service.create(dto);
  }
  @Get("current") current() {
    return this.service.getCurrent();
  }
  @Get(":id") findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }
  @Patch(":id/items") updateItems(
    @Param("id") id: string,
    @Body() dto: UpdateWeeklyPlanItemsDto,
  ) {
    return this.service.updateItems(id, dto);
  }
}
