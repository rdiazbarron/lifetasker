import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BlockTypesService } from './block-types.service';
import { CreateBlockTypeDto } from './dto/create-block-type.dto';
import { UpdateBlockTypeDto } from './dto/update-block-type.dto';
@Controller('block-types')
export class BlockTypesController {
 constructor(private readonly service: BlockTypesService) {}
 @Post() create(@Body() dto:CreateBlockTypeDto){ return this.service.create(dto); }
 @Get() findAll(){ return this.service.findAll(); }
 @Get(':id') findOne(@Param('id') id:string){ return this.service.findOne(id); }
 @Patch(':id') update(@Param('id') id:string,@Body() dto:UpdateBlockTypeDto){ return this.service.update(id,dto); }
 @Delete(':id') remove(@Param('id') id:string){ return this.service.remove(id); }
}
