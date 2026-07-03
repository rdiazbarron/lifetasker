import { Global, Module } from "@nestjs/common";
import { UserContextService } from "./user-context.service";
import { WeekService } from "./week.service";

@Global()
@Module({
  providers: [UserContextService, WeekService],
  exports: [UserContextService, WeekService],
})
export class CommonModule {}
