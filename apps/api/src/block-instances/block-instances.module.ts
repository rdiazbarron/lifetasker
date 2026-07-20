import { Module } from "@nestjs/common";
import { BlockInstancesController } from "./block-instances.controller";
import { BlockInstancesService } from "./block-instances.service";
import { PlanBootstrapperModule } from "../weekly-plans/plan-bootstrapper.module";
import { CalendarModule } from "../calendar/calendar.module";
@Module({
  imports: [PlanBootstrapperModule, CalendarModule],
  controllers: [BlockInstancesController],
  providers: [BlockInstancesService],
  exports: [BlockInstancesService],
})
export class BlockInstancesModule {}
