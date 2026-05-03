import { Module } from '@nestjs/common';
import { BlockInstancesController } from './block-instances.controller';
import { BlockInstancesService } from './block-instances.service';
import { WeeklyPlansModule } from '../weekly-plans/weekly-plans.module';
@Module({imports:[WeeklyPlansModule],controllers:[BlockInstancesController],providers:[BlockInstancesService],exports:[BlockInstancesService]})
export class BlockInstancesModule {}
