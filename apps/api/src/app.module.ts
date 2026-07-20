import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoriesModule } from "./categories/categories.module";
import { BlockTypesModule } from "./block-types/block-types.module";
import { WeeklyPlansModule } from "./weekly-plans/weekly-plans.module";
import { BlockInstancesModule } from "./block-instances/block-instances.module";
import { ProgressModule } from "./progress/progress.module";
import { EmblemsModule } from "./emblems/emblems.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CommonModule,
    CategoriesModule,
    BlockTypesModule,
    WeeklyPlansModule,
    BlockInstancesModule,
    ProgressModule,
    EmblemsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
