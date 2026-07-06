import { Controller, Get } from "@nestjs/common";
import { EmblemsService } from "./emblems.service";

@Controller("emblems")
export class EmblemsController {
  constructor(private readonly service: EmblemsService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
