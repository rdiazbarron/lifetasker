import { Controller, Get, Query } from "@nestjs/common";
import { ProgressService } from "./progress.service";
@Controller("progress")
export class ProgressController {
  constructor(private readonly service: ProgressService) {}
  @Get("current-week") currentWeek() {
    return this.service.currentWeek();
  }
  @Get("overview") overview() {
    return this.service.overview();
  }
  @Get("heatmap") heatmap(@Query("categoryId") categoryId?: string) {
    return this.service.heatmap(categoryId);
  }
}
