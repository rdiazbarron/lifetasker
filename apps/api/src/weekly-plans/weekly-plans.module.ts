import { Module } from "@nestjs/common";
import { WeeklyPlansController } from "./weekly-plans.controller";
import { WeeklyPlansService } from "./weekly-plans.service";
import { PlanBootstrapperModule } from "./plan-bootstrapper.module";
@Module({
  imports: [PlanBootstrapperModule],
  controllers: [WeeklyPlansController],
  providers: [WeeklyPlansService],
  exports: [WeeklyPlansService],
})
export class WeeklyPlansModule {}
