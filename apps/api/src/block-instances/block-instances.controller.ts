import { Body, Controller, Get, Post } from '@nestjs/common';
import { BlockInstancesService } from './block-instances.service';
import { CompleteBlockDto } from './dto/complete-block.dto';
@Controller('block-instances')
export class BlockInstancesController {
 constructor(private readonly service:BlockInstancesService){}
 @Post('complete') complete(@Body() dto:CompleteBlockDto){ return this.service.complete(dto); }
 @Get('current-week') currentWeek(){ return this.service.currentWeek(); }
}
