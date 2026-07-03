import { Module } from "@nestjs/common";
import { PlanBootstrapper } from "./plan-bootstrapper.service";

@Module({
  providers: [PlanBootstrapper],
  exports: [PlanBootstrapper],
})
export class PlanBootstrapperModule {}
