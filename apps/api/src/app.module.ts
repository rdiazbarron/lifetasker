import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { CommonModule } from "./common/common.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoriesModule } from "./categories/categories.module";
import { BlockTypesModule } from "./block-types/block-types.module";
import { WeeklyPlansModule } from "./weekly-plans/weekly-plans.module";
import { BlockInstancesModule } from "./block-instances/block-instances.module";
import { ProgressModule } from "./progress/progress.module";

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    CategoriesModule,
    BlockTypesModule,
    WeeklyPlansModule,
    BlockInstancesModule,
    ProgressModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
