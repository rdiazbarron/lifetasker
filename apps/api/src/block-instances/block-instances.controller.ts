import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { BlockInstancesService } from "./block-instances.service";
import { CompleteBlockDto } from "./dto/complete-block.dto";
@Controller("block-instances")
export class BlockInstancesController {
  constructor(private readonly service: BlockInstancesService) {}
  @Post("complete") complete(@Body() dto: CompleteBlockDto) {
    return this.service.complete(dto);
  }
  @Delete("complete/:blockTypeId") undoLast(@Param("blockTypeId") blockTypeId: string) {
    return this.service.undoLast(blockTypeId);
  }
  @Get("current-week") currentWeek() {
    return this.service.currentWeek();
  }
  // Completions for a single calendar day (UTC), so the history view can show
  // "what did I actually do on this day?" — including each completion's note.
  @Get("day") day(@Query("date") date: string) {
    return this.service.day(date);
  }
  @Post("sync") syncNow() {
    return this.service.syncNow();
  }
}
