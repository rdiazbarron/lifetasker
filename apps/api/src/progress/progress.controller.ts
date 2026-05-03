import { Controller, Get } from '@nestjs/common';
import { ProgressService } from './progress.service';
@Controller('progress')
export class ProgressController { constructor(private readonly service:ProgressService){} @Get('current-week') currentWeek(){ return this.service.currentWeek(); } }
