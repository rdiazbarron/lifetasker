import { Module } from '@nestjs/common';
import { BlockTypesController } from './block-types.controller';
import { BlockTypesService } from './block-types.service';
@Module({controllers:[BlockTypesController],providers:[BlockTypesService]})
export class BlockTypesModule {}
